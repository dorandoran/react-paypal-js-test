import { useState, useRef } from 'react'
import { PayPalScriptProvider, PayPalHostedFieldsProvider, PayPalHostedField, usePayPalHostedFields, usePayPalScriptReducer } from '@paypal/react-paypal-js';

const CLIENT_ID = process.env.REACT_APP_PAYPAL_CLIENT_ID
const GQL_SERVER = process.env.REACT_APP_GQL_SERVER
const TICKET_REQUEST = {
  attributes: {
    event: "events/d9e0e03e-5fdc-42b5-bf47-0cf732a5bfb0",
    items: [{
      product: "products/6202a943-af42-4333-8032-4c564b96e7b8",
      quantity: 1
    },
    {
      product: "products/1d7ec2d0-593c-4030-aecc-caf60472e531",
      quantity: 2
    }],
    billing: {
      address: {
        addressLine1: "Test",
        addressLine2: "",
        city: "",
        state: "",
        postalCode: 22310,
      },
      fullName: "Test Guy"
    }
  }
}

const Paypal = ({ token }) => {
  if (!token) return (<div>No Token</div>)
  console.log('CLIENT_ID ', CLIENT_ID)
  console.log('GQL_SERVER ', GQL_SERVER)

  const SubmitPayment = ({ customStyle }) => {
    const [paying, setPaying] = useState(false);
    const cardHolderName = useRef(null);
    const [{ isResolved }] = usePayPalScriptReducer()
    const hostedField = usePayPalHostedFields();
    console.log('resolved: ', isResolved)

    const handleClick = () => {
      if (!hostedField?.cardFields) {
        const childErrorMessage = 'Unable to find any child components in the <PayPalHostedFieldsProvider />';
        console.log('error: ', childErrorMessage)
      }
      const isFormInvalid =
        Object.values(hostedField.cardFields.getState().fields).some(
          (field) => !field.isValid
        ) || !cardHolderName?.current?.value;

      if (isFormInvalid) {
        return alert(
          "The payment form is invalid"
        );
      }
      setPaying(true);
      hostedField.cardFields
        .submit({
          cardholderName: cardHolderName?.current?.value,
        })
        .then((order) => {
          console.log('payment order :', order)
          fetch(GQL_SERVER, {
            method: 'post',
            headers: {
              'Content-Type': 'application/json',
              Authorization: 'Bearer t1'
            },
            body: JSON.stringify({
              query: `mutation paypalCapturePayment($orderId: String!) {
                paypalCapturePayment(orderId: $orderId) {
                  _id
                  productItems {
                    _id
                    product {
                      _id
                      name
                      amount
                    }
                  }
                }
            }`,
              variables: { "orderId": order.orderId }
            })
          })
            .then((response) => response.json())
            .then((data) => {
              console.log('payment data: ', data)
              // Inside the data you can find all the information related to the payment
            })
            .catch((err) => {
              // Handle any error
            });
        })
    };

    return (
      <>
        <label title="This represents the full name as shown in the card">
          Card Holder Name
          <input
            id="card-holder"
            ref={cardHolderName}
            className="card-field"
            style={{ ...customStyle, outline: "none" }}
            type="text"
            placeholder="Full name"
          />
        </label>
        <button
          className={`btn${paying ? "" : " btn-primary"}`}
          style={{ float: "right" }}
          onClick={handleClick}
        >
          {paying ? <div className="spinner tiny" /> : "Pay"}
        </button>
      </>
    );
  }

  const NotEligible = props => {
    return <>
      <div>
        Not eligible!
      </div>
    </>
  }

  // console.log('token: ', token)
  return (
    <PayPalScriptProvider options={{
      'client-id': CLIENT_ID,
      'data-client-token': token,
      components: 'buttons,hosted-fields',
      intent: "capture"
    }}>
      <PayPalHostedFieldsProvider notEligibleError={<NotEligible />} createOrder={() => {
        return fetch(GQL_SERVER, {
          method: 'post',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer t1'
          },
          body: JSON.stringify({
            query: `mutation createOrder($attributes: PaypalCreateOrderInput!) {
              paypalCreateOrder(attributes: $attributes) {
                id
              }
            }`,
            variables: TICKET_REQUEST
          })
        }).then(response => response.json()).then(order => {
          console.log('order: ', order)
          return order.data.paypalCreateOrder.id
        }).catch(err => {
          console.log('error: ', err)
        })
      }}>
        <div>
          Card Number
        </div>
        <PayPalHostedField
          id="card-number"
          hostedFieldType="number"
          options={{ selector: "#card-number" }}
        />
        <div>
          CVV
        </div>
        <PayPalHostedField
          id="cvv"
          hostedFieldType="cvv"
          options={{ selector: "#cvv" }}
        />
        <div>
          Expiration Date
        </div>
        <PayPalHostedField
          id="expiration-date"
          hostedFieldType="expirationDate"
          options={{
            selector: "#expiration-date",
            placeholder: "MM/YY",
          }}
        />
        <SubmitPayment />
      </PayPalHostedFieldsProvider>
    </PayPalScriptProvider>
  )
}

export default Paypal