module.exports = function (grunt) {
  // Project configuration.
  grunt.initConfig({
    mochaTest: {
      src: 'test/integration/**/*.js',
      options: {
        timeout: 30000
      }
    }
  })

  // Load grunt plugins for modules.
  grunt.loadNpmTasks('grunt-mocha-test')

  // Register tasks.
  grunt.registerTask('default', ['mochaTest'])
}
