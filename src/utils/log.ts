class Log {
  info = (...arg: any) => {
    console.log(...arg);
  }

  notion= (...arg: any) => {
    console.info(`%c NOTION::: \n`,  ...arg);
  }
}

export default  new Log()