import { useState, useCallback } from 'react';
import api from '../utils/api';

export function useApi() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const request = useCallback(async (method, endpoint, data = null) => {
    setLoading(true);
    setError(null);

    try {
      let response;
      switch (method) {
        case 'GET':
          response = await api.get(endpoint);
          break;
        case 'POST':
          response = await api.post(endpoint, data);
          break;
        case 'PUT':
          response = await api.put(endpoint, data);
          break;
        case 'DELETE':
          response = await api.delete(endpoint);
          break;
        default:
          throw new Error(`Unknown method: ${method}`);
      }
      return response;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const get = useCallback((endpoint) => request('GET', endpoint), [request]);
  const post = useCallback((endpoint, data) => request('POST', endpoint, data), [request]);
  const put = useCallback((endpoint, data) => request('PUT', endpoint, data), [request]);
  const del = useCallback((endpoint) => request('DELETE', endpoint), [request]);

  return { loading, error, get, post, put, del, setError };
}

export function useFetch(endpoint, options = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.get(endpoint);
      setData(response);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [endpoint]);

  const refetch = useCallback(() => {
    fetchData();
  }, [fetchData]);

  // Initial fetch
  useState(() => {
    if (!options.skip) {
      fetchData();
    }
  });

  return { data, loading, error, refetch };
}
