var http = require('http')

var wantjs = require('..')

var app = http.createServer(wantjs({
  entryList: {
    '/': '/app/index.jsx'
  },
  baseDir: '/test/apps/pure'
}))
var request = require('supertest')
let cheerio = require('cheerio')

describe('start wantjs with config', function () {
  it('should get the dependence list from html entry', function (done) {
    request(app)
        .get('/')
        .expect(function (res) {
          //let $ = cheerio.load(res.text)
          //var scripts = $('script')
          //scripts.each(function () {
          //  console.debug($(this).attr('src'))
          //})
          //res.body.totalScripts = scripts.length
        })
        .expect(200, {
          totalScripts: 3
        }, done)
  })

  it('should get entry js with init stament', function (done) {
    request(app)
        .get('/app/index.jsx')
        .expect(function (res) {
          console.debug(res.text)
          var haveInitStatment = res.text.endsWith('exports()')
          res.body.haveInitStatment = haveInitStatment
        })
        .expect(200, {
          haveInitStatment: true
        }, done)
  })

  it('should get  js with wrapper', function (done) {
    request(app)
        .get('/app/logger.js')
        .expect(function (res) {
          console.debug(res.text)
          var haveInitStatment = res.text.indexOf('exports)})("/app/logger.js")') !== -1
          res.body.haveInitStatment = haveInitStatment
        })
        .expect(200, {
          haveInitStatment: true
        }, done)
  })

  it('should get rumtime js without wrapper', function (done) {
    request(app)
        .get('/node_modules/wantjs/lib/runtime.js')
        .expect(function (res) {
          console.debug(res.text)
          var haveInitStatment = res.text.startsWith('var process')
          res.body.res = haveInitStatment
        })
        .expect(200, {
          res: true
        }, done)
  })
})
