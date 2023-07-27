import axios from 'axios'
import interceptors from './interceptors'

const API_URL = `${process.env.API_URL}api/v1/user`

export const registerUser = (payload) => {
  //console.log(payload)
  return axios.post(`${API_URL}/register`, payload)
}

export const getAllChallenges = () => {
  return axios.get(`${process.env.API_URL}/api/v1/challenge/finished/`)
}

export const filterPaidChallenges = (id) => {
  return axios.put(
    `${process.env.API_URL}api/v1/challenge/update/flag/${id?.id}`
  )
}

export const getAllChallengeWinners = (id) => {
  return axios.get(`${process.env.API_URL}/api/v1/challenge/${id?.id}/winner/`)
}

export const login = (payload) => {
  //console.log(payload)
  return axios.post(`${API_URL}/login`, payload)
}

export const getUser = () => {
  return axios.get(`${API_URL}/me`)
}

export const getUserByUsername = (payload) => {
  return axios.get(`${API_URL}/${payload}`)
}

export const updateUser = (payload) => {
  return axios.put(`${API_URL}/me`, payload)
}

interceptors(axios)
