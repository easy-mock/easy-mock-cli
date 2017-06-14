// https://github.com/vuejs/vue-cli/blob/master/lib/local-path.js

var path = require('path')

module.exports = {
  isLocalPath: function (templatePath) {
    return /^[./]|(^[a-zA-Z]:)/.test(templatePath)
  },

  getTemplatePath: function (templatePath, projectPath) {
    return path.isAbsolute(templatePath)
      ? templatePath
      : path.normalize(path.join(projectPath || process.cwd(), templatePath))
  }
}
