import React from 'react'
import { useHistory } from 'react-router-dom'
import { useMutation } from 'react-query'
import { toast } from 'react-toastify'
import Button from '@material-ui/core/Button'
import CircularProgress from '@material-ui/core/CircularProgress'
import Paper from '@material-ui/core/Paper'
import TextField from '@material-ui/core/TextField'
import Typography from '@material-ui/core/Typography'
import { makeStyles } from '@material-ui/core/styles'
import { registerUser } from 'services'
import { getDashAccount } from 'utils'
import Routes from 'routes'
import { isIdentity, isPassword } from '../../services/utilities'
import PasswordStrengthBar from 'react-password-strength-bar'
import Modal from '../../shared/showModal'
import { encryptMnemonic, secretKey } from 'utils/dash'

const useStyles = makeStyles((theme) => ({
  container: {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  wrapper: {
    display: 'flex',
    flexDirection: 'column',
    padding: theme.spacing(2),
    width: theme.spacing(50),
    border: `1px solid ${theme.palette.primary.main}`,
  },
  title: {
    marginBottom: theme.spacing(4),
  },
  dashAddress: {
    marginBottom: theme.spacing(2),
    color: theme.palette.primary.main,
  },
  textInput: {
    marginBottom: theme.spacing(2),
  },
  unlockButton: {
    marginBottom: theme.spacing(2),
  },
}))

const SignUp = () => {
  const styles = useStyles()
  const [username, setUsername] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [confirm, setConfirm] = React.useState('')
  const [accountInfo, setAccountInfo] = React.useState({})
  const [isAccountCreated, setAccountCreated] = React.useState(false)
  const { mutate } = useMutation(registerUser)
  const history = useHistory()
  const [showModal, setShowModal] = React.useState(false)
  const [copyMnemonic, setCopyMnemonic] = React.useState('')

  React.useEffect(() => {
    getDashAccount()
      .then((account) => {
        setAccountInfo(account)
        const {
          mnemonic,
          balance: { confirmed: balance },
        } = account
        if (balance === 0) {
          toast.warn(`Please charge your account`)
        }
        setCopyMnemonic(mnemonic)
        setAccountCreated(true)
      })
      .catch((e) => {
        toast.error(e.toString())
      })
  }, [])

  React.useEffect(() => {
    if (copyMnemonic)
      encryptMnemonic(copyMnemonic, secretKey).then((res) =>
        localStorage.setItem('code', res)
      )
  }, [copyMnemonic])

  const handleUsernameChange = React.useCallback(({ target: { value } }) => {
    setUsername(value)
  }, [])
  const handlePasswordChange = React.useCallback(({ target: { value } }) => {
    setPassword(value)
  }, [])
  const handleConfirmChange = React.useCallback(({ target: { value } }) => {
    setConfirm(value)
  }, [])

  const handleCreate = React.useCallback(async () => {
    try {
      const mnemonic = localStorage.getItem('code')
      mutate(
        {
          username,
          password,
          identity: accountInfo.address,
          private_key: mnemonic,
        },
        {
          onError: (error) => {
            toast.error(error.toString())
          },
          onSuccess: () => {
            setShowModal(true)
          },
        }
      )
    } catch (e) {
      toast.error(e.toString())
    }
  }, [username, password, mutate, accountInfo])

  const isCreateDisabled = React.useMemo(() => {
    return isIdentity(username) || isPassword(password) || password !== confirm
  }, [password, confirm, username])

  return (
    <>
      {showModal ? (
        <Modal closeCall={true}>
          <div>
            <h1 style={{ fontWeight: 'bold' }}>Back up mnemonic phrase </h1>
            <hr style={{ marginTop: '0.75rem', marginBottom: '0.75rem' }} />
            <p>
              Write down or copy these words in the right order and keep them in
              a safe place. You are advised to write them down
            </p>
            <p
              style={{
                marginTop: '0.75rem',
                fontWeight: 'bold',
                color: 'blue',
              }}
            >{`"${copyMnemonic}"`}</p>
            <button
              type='submit'
              style={{
                fontWeight: 'bold',
                marginTop: '1rem',
                paddingTop: '0.5rem',
                paddingBottom: '0.5rem',
                paddingLeft: '1rem',
                paddingRight: '1rem',
                borderRadius: '0.25rem',
                width: '100%',
                backgroundColor: 'blue',
                color: 'white',
                hoverBackgroundColor: 'white',
                hoverColor: 'white',
                hoverBoxShadow:
                  '0 0 0 3px rgba(59, 130, 246, 0.5), 0 0 0 5px rgba(59, 130, 246, 0.3)',
                focusOutline: 'none',
                focusBackgroundColor: 'primary',
                focusBoxShadow:
                  '0 0 0 3px rgba(59, 130, 246, 0.5), 0 0 0 5px rgba(59, 130, 246, 0.3)',
              }}
              onClick={() => {
                navigator.clipboard.writeText(copyMnemonic)
                history.push(Routes.Login.path)
              }}
            >
              Copy
            </button>
          </div>
        </Modal>
      ) : (
        <div className={styles.container}>
          <Paper className={styles.wrapper}>
            <Typography className={styles.title} variant='h5' align='center'>
              Create Wallet
            </Typography>
            {!isAccountCreated ? (
              <CircularProgress />
            ) : (
              <>
                <Typography>Your Dash Address is</Typography>
                <div className={styles.dashAddress}>{accountInfo?.address}</div>
                <TextField
                  className={styles.textInput}
                  variant='outlined'
                  label='Username'
                  value={username}
                  onChange={handleUsernameChange}
                />
                {username && isIdentity(username) && (
                  <div>
                    <small style={{ color: 'red', paddingBottom: 20 }}>
                      Must be Less than 20 characters !
                    </small>
                  </div>
                )}
                <TextField
                  className={styles.textInput}
                  label='Password'
                  variant='outlined'
                  type='password'
                  value={password}
                  onChange={handlePasswordChange}
                />
                <TextField
                  className={styles.textInput}
                  label='Confirm'
                  variant='outlined'
                  type='password'
                  value={confirm}
                  onChange={handleConfirmChange}
                />

                {password && isPassword(password) && (
                  <div>
                    <small style={{ color: 'red' }}>
                      Must be at least 8 characters long and include upper and
                      lowercase letters and at least one number !
                    </small>
                  </div>
                )}

                <PasswordStrengthBar
                  style={{ marginTop: 10 }}
                  password={password}
                />
                <Button
                  disabled={isCreateDisabled}
                  className={styles.unlockButton}
                  color='primary'
                  variant='contained'
                  onClick={handleCreate}
                >
                  Create
                </Button>
              </>
            )}
          </Paper>
        </div>
      )}
    </>
  )
}

export default SignUp
