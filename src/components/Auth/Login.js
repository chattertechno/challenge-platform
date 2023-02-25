import React,{useState,useRef}  from 'react'

import { useMutation } from 'react-query'
import { toast } from 'react-toastify'
import { useHistory } from 'react-router-dom'
import Button from '@material-ui/core/Button'
import Paper from '@material-ui/core/Paper'
import TextField from '@material-ui/core/TextField'
import Typography from '@material-ui/core/Typography'
import { makeStyles } from '@material-ui/core/styles'
import { login } from 'services/user'
import { isAuthenticated } from 'utils'
import Routes from 'routes'
import ReCAPTCHA from "react-google-recaptcha";
import PasswordStrengthBar from 'react-password-strength-bar'
import { isIdentity, isPassword } from '../../services/utilities'


const useStyles = makeStyles((theme) => ({
  container: {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  container2: {
    display: 'flex',
    alignItems: 'center',
    padding: theme.spacing(2),
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
  textInput: {
    marginBottom: theme.spacing(2),
  },
  unlockButton: {
    marginBottom: theme.spacing(2),
  },
}))

const Login = () => {
  const styles = useStyles()
  const [identity, setIdentity] = React.useState('')
  const [password, setPassword] = React.useState('')
  const { mutate } = useMutation(login)
  const history = useHistory()
  const captchaRef = useRef(null);
  const TEST_SITE_KEY = "6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI";

  React.useEffect(() => {
    if (isAuthenticated()) {
      history.push(Routes.Dashboard.path)
    }
  }, [history])

  const handleUnlock = React.useCallback(() => {
    let token = captchaRef.current.getValue();

    if (!identity || !password) {
      toast.error('Username and Password should not be blank')
      return
    }
    mutate(
      {
        username: identity,
        password,
      },
      {
        onSuccess: ({ data: { msg: token } }) => {
          debugger
          localStorage.setItem('token', token)
          history.push(Routes.Dashboard.path)
        },
        onError: () => {
          toast.error('Wrong credentials')
        },
      }
    )
  }, [identity, password, mutate, history])
  const handleIdentityChange = React.useCallback(({ target: { value } }) => {
    setIdentity(value)
  }, [])
  const handlePasswordChange = React.useCallback(({ target: { value } }) => {
    setPassword(value)
  }, [])
  const handleCreate = React.useCallback(() => {
    history.push(Routes.CreateWallet.path)
  }, [history])
  const isUnlockDisabled = React.useMemo(() => {
    return isIdentity(identity) || isPassword(password)
  }, [identity, password])
  const onChange = (value) => {
    console.log("Captcha value:", value);
  }

  
  return (
    <div  >
    <div className={styles.container}>
    
      <Paper className={styles.wrapper}>
        <Typography className={styles.title} variant='h5' align='center'>
          Login
        </Typography>
        <TextField
          className={styles.textInput}
          variant='outlined'
          label='Username'
          value={identity}
          onChange={handleIdentityChange}
        />
        {identity && isIdentity(identity) && (
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

<ReCAPTCHA
    sitekey={TEST_SITE_KEY}
    ref={captchaRef}
    onChange={onChange}
  />
        <Button
          style={{ marginTop: 10 }}
          className={styles.unlockButton}
          color='primary'
          variant='contained'
          onClick={handleUnlock}
        >
          Unlock
        </Button>
        <Button onClick={handleCreate}>Create Wallet</Button>
      </Paper>
    
    </div>  
    </div>
  )
}

export default Login
