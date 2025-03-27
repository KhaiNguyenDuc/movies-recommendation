import axios from 'axios';
import { getRecommendations } from '../actions';

export default axios.create({
  baseURL: 'https://api.themoviedb.org/3',
  params: {
    api_key: process.env.REACT_APP_API,
  },
});
