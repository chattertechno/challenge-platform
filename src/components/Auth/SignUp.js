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
import { getDashAccount, getMnemonic } from 'utils'
import Routes from 'routes'
import { isIdentity, isPassword } from '../../services/utilities'
import PasswordStrengthBar from 'react-password-strength-bar'

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

  React.useEffect(() => {
    const mnemonic = getMnemonic()
    //console.log(mnemonic)
    getDashAccount(mnemonic)
      .then((account) => {
        setAccountInfo(account)
        const {
          mnemonic,
          balance: { confirmed: balance },
        } = account
        if (balance === 0) {
          toast.warn(`Please charge your account`)
        }
        localStorage.setItem('mnemonic', mnemonic)
        setAccountCreated(true)
      })
      .catch((e) => {
        toast.error(e.toString())
      })
  }, [])

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
      // const id = await registerIdentity(getMnemonic())
      const mnemonic = getMnemonic()
      mutate(
        {
          username,
          password,
          identity: accountInfo.address,
          mnemonic,
        },
        {
          onError: (error) => {
            toast.error(error.toString())
          },
          onSuccess: () => {
            history.push(Routes.Login.path)
          },
        }
      )
    } catch (e) {
      toast.error(e.toString())
    }
  }, [username, password, mutate, accountInfo, history])

  const isCreateDisabled = React.useMemo(() => {
    return isIdentity(username) || isPassword(password) || password !== confirm
  }, [password, confirm, username, accountInfo])

  return (
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
            <div className={styles.dashAddress}>{accountInfo.address}</div>
            <TextField
              className={styles.textInput}
              variant='outlined'
              label='Username'
              value={username}
              onChange={handleUsernameChange}
            />
            {username && isIdentity(username) && (
                    <div>
                      <small style={{ color: "red",paddingBottom: 20 }}>
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
                      <small style={{ color: "red" }} >
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
  )
}

export default SignUp
