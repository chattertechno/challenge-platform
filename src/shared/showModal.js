import { useHistory } from 'react-router-dom'
import PropTypes from 'prop-types'
import '../index.css'
const Modal = ({ children, closeCall }) => {
  const history = useHistory()

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        position: 'fixed',
        zIndex: 50,
        top: 0,
        left: 0,
        height: '100vh',
        width: '100%',
      }}
    >
      <div
        style={{
          position: 'absolute',
          height: '100vh',
          width: '100%',
          backdropFilter: 'blur(4px)',
          backgroundColor: 'rgba(255, 255, 255, 0.4)',
        }}
      ></div>
      <div
        style={{
          boxShadow: '0px 1px 2px 0px rgba(0, 0, 0, 0.05)',
          padding: '1.25rem',
          width: '50%',
          minWidth: 'fit-content',
          marginLeft: '1.5rem',
          marginRight: '1.5rem',
          height: 'fit-content',
          marginTop: '10vh',
          backgroundColor: '#ffffff',
          zIndex: 10,
          borderRadius: '0.375rem',
          overflowY: 'auto',
          maxHeight: '80vh',
        }}
      >
        {/* close button */}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            className='focus:outline-none'
            onClick={() => {
              if (closeCall) history.push('/login')
            }}
            style={{ outline: 'none' }}
          >
            <svg
              xmlns='http://www.w3.org/2000/svg'
              style={{ height: '1.5rem', width: '1.5rem', color: '#9CA3AF' }}
              fill='none'
              viewBox='0 0 24 24'
              stroke='currentColor'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M6 18L18 6M6 6l12 12'
              />
            </svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

Modal.propTypes = {
  children: PropTypes.arrayOf(PropTypes.element),
  closeCall: PropTypes.bool,
}

export default Modal
