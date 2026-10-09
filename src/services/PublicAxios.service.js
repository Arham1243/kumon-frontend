import axios from 'axios';

const publicAxios = axios.create({
    headers: {
        Accept: 'application/json'
    }
});

export default publicAxios;
