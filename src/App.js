import logo from './logo.svg';
import './App.css';
import { useEffect, useState } from 'react';
import Paypal from './paypal'

const GQL_SERVER = 'http://localhost:4000/gql'

function App() {
  const [token, setToken] = useState(null)

  useEffect(() => {
    fetchToken()
  }, [])

  const fetchToken = async () => {
    try {
      const response = await fetch(GQL_SERVER, {
        method: 'post',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer t1'
        },
        body: JSON.stringify({
          query: `mutation clientToken {
          paypalCreateClientToken {
              token
          }
        }`,
          variables: {}
        })
      })
      const data = await response.json()
      setToken(data.data.paypalCreateClientToken.token)
    } catch (e) {
      console.log('error!')
      console.log(e)
    }
  }
  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <Paypal token={token} />
      </header>
    </div>
  );
}

export default App;
