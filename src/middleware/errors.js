function notFound(_req, res) {
  return res.status(404).render("error", {
    title: "Not Found",
    message: "The page you are looking for does not exist.",
    user: null
  });
}

function errorHandler(err, req, res, _next) {
  console.error(err);
  return res.status(500).render("error", {
    title: "Server Error",
    message: "Something went wrong. Please try again.",
    user: req.user || null
  });
}

module.exports = { notFound, errorHandler };
