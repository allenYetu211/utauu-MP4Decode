// import axios from 'axios';

interface Prop {
  url: string,
  start?: string | number,
  end?: string | number
}

const endBytes = 200000;


export default ({ url, start = 0,end = endBytes }: Prop) => {
  // @ts-ignore
  return axios({
    url,
    method: 'get',
    headers:  {
      ContentType: `multipart/byteranges`,
      Range:  `bytes=${start}-${end}`
    }
  })
}