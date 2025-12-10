// vulnerable: dangerouslySetInnerHTML
function Comment({ html }) {
  // I removed dangerouslySetInnerHTML, this escapes special characters, preventing XSS.
  return <div>{html}</div>
}
