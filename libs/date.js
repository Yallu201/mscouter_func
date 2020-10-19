function getDateString() {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = today.getMonth() + 1; // getMonth() is zero-based
  const dd = today.getDate();

  return [yyyy, (mm > 9 ? "" : "0") + mm, (dd > 9 ? "" : "0") + dd].join("");
}

module.exports = getDateString;
