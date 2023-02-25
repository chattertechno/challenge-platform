import React, { useState } from 'react'
import { useMutation } from 'react-query'
import { toast } from 'react-toastify'
import Container from '@material-ui/core/Container'
import { makeStyles } from '@material-ui/core/styles'
import { updateUser } from 'services/user'
import Typography from '@material-ui/core/Typography'
import PageWrapper from 'components/common/PageWrapper/PageWrapper'
import {
  Avatar,
  Box,
  Button,
  CircularProgress,
  Grid,
  TextField,
} from '@material-ui/core'
import { getAvatarString } from 'utils'
import { useAppState } from '../../context/stateContext'
import { useEffect } from 'react'
import { getDashAccount, getMnemonic } from 'utils'

const useStyles = makeStyles((theme) => ({
  container: {
    width: '100%',
    height: '100%',
  },
  avatar: {
    width: 130,
    height: 130,
    fontSize: 70,
    [theme.breakpoints.down('xs')]: {
      width: 60,
      height: 60,
      fontSize: 30,
    },
  },
  textInput: {
    width: 400,
    [theme.breakpoints.down('xs')]: {
      width: '100%',
    },
  },
}))

const Profile = () => {
  const styles = useStyles()
  const { mutate: mutateUpdateUser } = useMutation(updateUser)
  const { currentUser, useFetchUser } = useAppState()
  const [user, setUser] = useState({})
  const [loading, setLoading] = useState(true)
  const [accountInfo, setAccountInfo] = React.useState({})

  const [imageUrl, setImageUrl] = useState(null)
  useFetchUser()
  const [selectedImage, setSelectedImage] = useState(null)
React.useEffect(() => {
    const mnemonic = getMnemonic()
    //console.log(mnemonic)
    getDashAccount(mnemonic)
      .then((account) => {
        setAccountInfo(account)
        debugger
        localStorage.setItem('mnemonic', mnemonic)
      })
      .catch((e) => {
        toast.error(e.toString())
      })
  }, [])
  React.useEffect(() => {
    if (currentUser) {
      setLoading(false)
      setUser(currentUser)
    }
  }, [currentUser])
  console.log(user)
  const onSave = React.useCallback(() => {
    mutateUpdateUser(user, {
      onSuccess: ({ data }) => {
        toast.success(`Successfully updated profile data`)
        localStorage.setItem('token', data.msg)
      },
      onError: () => {
        toast.error(`Can't update profile data`)
      },
    })
  }, [mutateUpdateUser, user])

  
  useEffect(() => {
    if (selectedImage) {
      setImageUrl(URL.createObjectURL(selectedImage))

      localStorage.setItem('imge', imageUrl)
      setUser({ ...user, avatar: imageUrl })
    }
  })
  const handleUpload = (e) => {
    setSelectedImage(e.target.files[0])
  }
  return (
    <Container maxWidth='md' className={styles.container}>
      <PageWrapper title={'Profile'}>
        <Box display='flex' alignItems='center' flexDirection='column'>
          {loading && <CircularProgress />}
          {!loading && (
            <Grid container direction='column' spacing={3} alignItems='center'>

              <Grid item>
                {imageUrl ? (
                  <img
                    className={styles.avatar}
                    src={imageUrl}
                    alt=''
                    width={200}
                  />
                ) : (
                  <div>
                    <Box position='relative'>
                      <Avatar className={styles.avatar}>
                        {getAvatarString(user.username)}
                      </Avatar>
                    </Box>
                    <Box position='absolute' mt='-100px'>
                      <input
                        className={styles.input}
                        accept='image/*'
                        type='file'
                        id='select-image'
                        name='Upload a file'
                        style={{
                          zIndex: -1000,
                          cursor: 'pointer',
                          opacity: '0',
                          width: 130,
                          height: 130,
                          fontSize: 50,
                        }}
                        onChange={handleUpload}
                      />
                    </Box>
                  </div>
                )}
              </Grid>
                            <Typography>Your Dash Address is</Typography>
            <div className={styles.dashAddress}>{accountInfo.address}</div>
              <Grid item>
                <TextField
                  className={styles.textInput}
                  variant='outlined'
                  label='Username'
                  value={user.username}
                  onChange={({ target: { value } }) =>
                    setUser({ ...user, username: value })
                  }
                />
              </Grid>
              <Grid item>
                <TextField
                  className={styles.textInput}
                  variant='outlined'
                  label='Bio'
                  value={user.bio}
                  onChange={({ target: { value } }) =>
                    setUser({ ...user, bio: value })
                  }
                  multiline
                  rows={5}
                />
              </Grid>
              <Grid item>
                <Button
                  color='primary'
                  variant='contained'
                  className={styles.button}
                  onClick={onSave}
                >
                  Save
                </Button>
              </Grid>
            </Grid>
          )}
        </Box>
      </PageWrapper>
    </Container>
  )
}

export default Profile
