const defaultTemplateData = {}

const dollar = cents => {
  const d = cents / 100
  const c = (d - Math.floor(d)) * 100
  return `\$${d < 1 ? '0' : Math.floor(d)}.${
    c < 10 ? `0${c}` : c }`
}

defaultTemplateData.dollar = dollar

const showPage = (req, res, template, data = {}) => {
  const loggedIn = req.cookies.user
  return res.render(template, {...defaultTemplateData, ...data, loggedIn })
}

module.exports = {
  defaultTemplateData,
  showPage,
}
