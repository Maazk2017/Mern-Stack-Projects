import React from 'react'

const Loader = () => {
  return (
    <div className='d-flex flex-column align-items-center justify-content-center my-5 py-5'>
      <div className='visually-hidden'>
        Loading...
      </div>
      <p className='text-muted fw-semibold mb-0'></p>
    </div>
  )
}

export default Loader