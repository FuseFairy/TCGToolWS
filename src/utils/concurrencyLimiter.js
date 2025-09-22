export const createConcurrencyLimiter = (concurrency) => {
  const queue = []
  let running = 0

  const runNext = () => {
    if (running >= concurrency || queue.length === 0) {
      return
    }

    running++
    const { task, resolve, reject } = queue.shift()

    task()
      .then(resolve)
      .catch(reject)
      .finally(() => {
        running--
        runNext()
      })
  }

  const add = (task) => {
    return new Promise((resolve, reject) => {
      queue.push({ task, resolve, reject })
      runNext()
    })
  }

  return { add }
}
