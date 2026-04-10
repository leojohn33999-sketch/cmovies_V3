export function getCookie(name) {
  let cookieArr = document.cookie.split(";");

  for (let c of cookieArr) {
    let [key, value] = c.trim().split("=");
    if (key === name) return value;
  }

  return null; // not found
}