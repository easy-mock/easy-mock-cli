// https://github.com/vuejs/vue-cli/blob/master/lib/generate.js

const path = require('path')
const fs = require('fs')
const _ = require('lodash')
const axios = require('axios')
const Metalsmith = require('metalsmith')

const logger = require('./logger')

let config
let projectPath
let templatePath

function compareProjectIds (source, obj) {
  const di = _.xor(source, obj)
  if (!_.isEmpty(di)) {
    logger.log('"%s" 生成失败，请检查 ID 是否正确.', di.join(','))
    // 同步过滤配置项
    config.projects = config.projects.filter(o => !_.includes(di, o.id))
  }
}

function filterAPI (apis) {
  Object.keys(apis).forEach((projectId) => {
    const api = apis[projectId]
    const confProject = _.find(config.projects, ['id', projectId])

    if (!confProject) return

    const whiteList = confProject.white
    const blackList = confProject.black

    api.mocks = api.mocks.filter((mock) => {
      if (!_.isEmpty(whiteList)) {
        return _.includes(whiteList, mock.url)
      } else if (!_.isEmpty(blackList)) {
        return !_.includes(blackList, mock.url)
      }
      return true
    })
  })
}

function init (apis, cb) {
  const projectIds = Object.keys(apis)
  const helperPath = path.resolve(templatePath, '../helper/index.js')
  const helper = fs.existsSync(helperPath) ? require(helperPath) : {}

  projectIds.forEach((projectId) => {
    const api = apis[projectId]
    const confProject = _.find(config.projects, ['id', projectId])

    if (!confProject) return

    const dest = path.join(config.output, confProject.name)
    const data = {
      data: api,
      config: config,
      _: _,
      $$: Object.assign({}, helper, {
        relative: function (targetFile) {
          const relative = path.relative(dest, config.output)
          return path.join(relative, targetFile)
        }
      })
    }

    build(data, 'cover', dest, cb)
    if (fs.existsSync(path.join(templatePath, 'init'))) build(data, 'init', dest, cb, true)
  })

  if (fs.existsSync(path.join(templatePath, 'common'))) {
    build({
      config: config,
      _: _,
      $$: helper
    }, 'common', config.output, cb, true)
  }
}

function build (data, source, dest, cb, ignore) {
  const metalsmith = Metalsmith(templatePath)
      .use(renderTemplateFiles(data))
      .clean(false)
      .source(source)
      .destination(dest)

  if (ignore) {
    metalsmith.ignore(filePath => {
      filePath = filePath.replace(path.join(templatePath, source), '')
      filePath = path.join(dest, filePath)
      return fs.existsSync(filePath)
    })
  }

  return metalsmith.build((error, files) => {
    if (error) logger.fatal(error)
    const f = Object.keys(files)
      .filter(o => fs.existsSync(path.join(dest, o)))
      .map(o => path.join(dest, o))
    cb(error, f)
  })
}

function renderTemplateFiles (data) {
  return function (files) {
    Object.keys(files).forEach((fileName) => {
      const file = files[fileName]
      file.contents = _.template(file.contents)(data)
    })
  }
}

module.exports = function (_projectPath, _templatePath, _config, cb) {
  config = _config
  projectPath = _projectPath

  templatePath = path.join(_templatePath, 'template')
  config.output = path.resolve(projectPath, config.output || 'easy-mock-api')

  if (_.isEmpty(config.projects)) return
  if (!_.isArray(config.projects)) logger.fatal('请正确配置项目列表.')

  const projectIds = config.projects
    .filter(o => _.has(o, 'id') && _.has(o, 'name'))
    .map(project => project.id)

  if (projectIds.length !== config.projects.length) logger.fatal('缺少字段，请正确配置项目列表.')

  config.host = config.host || 'https://www.easy-mock.com'

  let api = config.host.slice(-1) === '/'
  ? `${config.host}api/mock/by_projects`
  : `${config.host}/api/mock/by_projects`

  axios
    .get(api, {
      params: {
        project_ids: projectIds.join(',')
      }
    })
    .then((res) => {
      const data = res.data.data
      if (data) {
        filterAPI(data)
        compareProjectIds(projectIds, Object.keys(data))
        init(data, cb)
      } else {
        compareProjectIds(projectIds, [])
      }
    })
    .catch(error => {
      if (error.response) {
        logger.fatal(error.response.data)
      } else {
        logger.fatal(error)
      }
    })
}
