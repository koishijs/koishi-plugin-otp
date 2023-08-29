export function randomUUID() {
  return (v4() + v4() + '-' + v4() + '-' + v4() + '-' + v4() + '-' + v4() + v4() + v4())
}

function v4() {
    return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1)
}