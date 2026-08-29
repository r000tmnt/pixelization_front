import request from './request'

const convert = (form: FormData) => {
  return request.post('/pixel/convert', form)
}

export default {
  convert,
}
