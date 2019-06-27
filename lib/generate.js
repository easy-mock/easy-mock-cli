// https://github.com/vuejs/vue-cli/blob/master/lib/generate.js

var path = require('path')
var fs = require('fs')
var _ = require('lodash')
var axios = require('axios')
var Metalsmith = require('metalsmith')

var logger = require('./logger')

var config
var projectPath
var templatePath

function compareProjectIds (source, obj) {
  var di = _.xor(source, obj)
  if (!_.isEmpty(di)) {
    logger.log('"%s" 生成失败，请检查 ID 是否正确.', di.join(','))
    // 同步过滤配置项
    config.projects = config.projects.filter(o => !_.includes(di, o.id))
  }
}

function filterAPI (apis) {
  Object.keys(apis).forEach((projectId) => {
    var api = apis[projectId]
    var confProject = _.find(config.projects, ['id', projectId])

    if (!confProject) return

    var whiteList = confProject.white
    var blackList = confProject.black

    api.mocks = api.mocks.filter((mock) => {
      if (!_.isEmpty(whiteList)) {
        return _.includes(revertUrl(whiteList, mock.url), mock.url)
      } else if (!_.isEmpty(blackList)) {
        return !_.includes(revertUrl(blackList, mock.url), mock.url)
      }
      return true
    })
  })
}

function revertUrl (filters, url) {
  return filters.map(filter => {
    return url.indexOf(filter) !== -1 ? url : filter
  })
}

function init (apis, cb) {
  var projectIds = Object.keys(apis)
  var helperPath = path.resolve(templatePath, '../helper/index.js')
  var helper = fs.existsSync(helperPath) ? require(helperPath) : {}

  projectIds.forEach((projectId) => {
    var api = apis[projectId]
    var confProject = _.find(config.projects, ['id', projectId])

    if (!confProject) return

    var dest = path.join(config.output, confProject.name)
    var data = {
      data: api,
      config: config,
      project: confProject,
      _: _,
      $$: Object.assign({}, helper, {
        relative: function (targetFile) {
          var relative = path.relative(dest, config.output)
          return path.posix.join(relative, targetFile)
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

function helper (data, source) {
  var helperPath = path.resolve(templatePath, '../helper/metalsmith.js')
  var helper = fs.existsSync(helperPath) ? require(helperPath) : function () {}

  return function (files, metalsmith, done) {
    files = helper(data, files, source) || files
    done()
  }
}

function build (data, source, dest, cb, ignore) {
  var metalsmith = Metalsmith(templatePath)
    .use(helper(data, source))
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
    var f = Object.keys(files)
      .filter(o => fs.existsSync(path.join(dest, o)))
      .map(o => path.join(dest, o))
    cb(error, f)
  })
}

function renderTemplateFiles (data) {
  return function (files) {
    Object.keys(files).forEach((fileName) => {
      var file = files[fileName]
      file.contents = _.template(file.contents, {
        interpolate: /\{\{(.+?)\}\}/g
      })(data)
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

  var projectIds = config.projects
    .filter(o => _.has(o, 'id') && _.has(o, 'name'))
    .map(project => project.id)

  if (projectIds.length !== config.projects.length) logger.fatal('缺少字段，请正确配置项目列表.')

  config.host = config.host || 'https://www.easy-mock.com'

  var api = config.host.slice(-1) === '/'
    ? `${config.host}api/mock/by_projects`
    : `${config.host}/api/mock/by_projects`

  axios
    .get(api, {
      params: {
        project_ids: projectIds.join(',')
      }
    })
    .then((res) => {
      var data = res.data.data
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
