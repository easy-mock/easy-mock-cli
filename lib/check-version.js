var axios = require('axios')
var semver = require('semver')
var chalk = require('chalk')
var packageConfig = require('../package.json')

module.exports = function (done) {
  axios
    .get('https://registry.npmjs.org/easy-mock-cli', {
      timeout: 5000
    })
    .then((res) => {
      if (res.status === 200) {
        var latestVersion = res.data['dist-tags'].latest
        var localVersion = packageConfig.version
        if (semver.lt(localVersion, latestVersion)) {
          console.log(chalk.yellow('  easy-mock-cli 有新版本更新建议升级.'))
          console.log()
          console.log('  最新版本: ' + chalk.green(latestVersion))
          console.log('  本地版本: ' + chalk.red(localVersion))
          console.log()
        }
      }
      done()
    })
    .catch(done)
}
