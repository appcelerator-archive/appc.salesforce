/**
 * support search using SOSL
 * @param sosl
 * @param next
 */
exports.search = function (sosl, next) {
  this.sdkAPI.search(sosl, next)
}
