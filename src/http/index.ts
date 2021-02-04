interface Prop {
  url: string,
  start?: string | number,
  end?: string | number
}

const endBytes = 200000;

// const rRange = /(\d+)-(\d+)\/(\d+)/;

export  default   ({ url, start = 0,end = endBytes }: Prop) =>  {
  return new Promise((response, reject) => {
    fetch(url, {
      headers: {
        Range:  `bytes=${start}-${end}`
      }
    }).then((res) => {
      response(res)
    }).catch((error) => {
      reject(error)
    })
  })
}
