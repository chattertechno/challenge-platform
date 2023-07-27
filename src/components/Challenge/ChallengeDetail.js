import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Link,
  makeStyles,
  Typography,
  Grid,
  TextField,
} from '@material-ui/core'
import PageWrapper from 'components/common/PageWrapper/PageWrapper'
import React, { useEffect, useState, useCallback } from 'react'
import { useMutation } from 'react-query'
import { useParams } from 'react-router'
import { toast } from 'react-toastify'
import { getChallenge, joinChallenge, postSteps } from 'services/challenge'
import { convertFromUTC } from 'utils/date'
import * as Yup from 'yup'
import { useAppState } from '../../context/stateContext'
import ChallengeAcceptModal from './ChallengeAcceptModal'
import { Formik, Form, Field } from 'formik'
import {
  decryptMnemonic,
  jwtDecode,
  secretKey,
  sendFundsToChallengeWinners,
  sendFundsToEscrow,
} from 'utils/dash'
import { filterPaidChallenges, getAllChallengeWinners } from 'services/user'

const useStyles = makeStyles(() => ({
  container: {
    width: '100%',
    height: '100%',
  },
}))

const STATUS_UPCOMING = 'upcoming'
const STATUS_STARTED = 'started'
const STATUS_ENDED = 'ended'

export default function ChallengeDetail() {
  const classes = useStyles()
  const { currentUser, useFetchUser } = useAppState()
  const { id } = useParams()
  const { mutate: mutateGetChallenge } = useMutation(getChallenge)

  const { mutate: mutatePostSteps } = useMutation(postSteps)

  const { mutate: mutateJoinChallenge } = useMutation(joinChallenge)

  const [challenge, setChallenge] = useState()

  const initialValues = {
    count: '',
    distance: '',
  }

  const minBet = challenge?.add_bet || ''

  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState()
  const [liveTime, setLiveTime] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  })
  const [openAcceptModal, setOpenAcceptModal] = useState(false)

  const [betAmount, setBetAmount] = useState(challenge?.add_bet) // Initialize betAmount with the initial minBet value

  let results = []
  useFetchUser()

  useEffect(() => {
    setBetAmount(challenge?.add_bet)
  }, [challenge])

  useEffect(() => {
    reload()
  }, [reload])

  useEffect(() => {
    const timerId = setInterval(() => {
      const now = new Date()
      let delta
      if (challenge?.start_date && challenge?.end_date) {
        if (convertFromUTC(challenge?.end_date) > now) {
          if (convertFromUTC(challenge?.start_date) > now) {
            delta = Math.floor(
              (convertFromUTC(challenge?.start_date) - now.getTime()) / 1000
            )
            setStatus(STATUS_UPCOMING)
          } else {
            delta = Math.floor(
              (convertFromUTC(challenge?.end_date) - now.getTime()) / 1000
            )
            setStatus(STATUS_STARTED)
          }

          let days = Math.floor(delta / 86400)
          delta -= days * 86400

          // calculate (and subtract) whole hours
          let hours = Math.floor(delta / 3600) % 24
          delta -= hours * 3600

          // calculate (and subtract) whole minutes
          let minutes = Math.floor(delta / 60) % 60
          delta -= minutes * 60

          // what's left is seconds
          let seconds = delta % 60
          setLiveTime({
            days,
            hours,
            minutes,
            seconds,
          })
        } else {
          setStatus(STATUS_ENDED)
          setLiveTime({
            days: 0,
            hours: 0,
            minutes: 0,
            seconds: 0,
          })
          clearInterval(timerId)
        }
      }
    }, 1000)

    return () => clearInterval(timerId)
  }, [challenge])

  // const joinAvailability = useMemo(
  //   () =>
  //     !status === STATUS_STARTED ||
  //     (challenge.participants
  //       ? challenge.participants.findIndex(
  //           (user) => user === currentUser.username
  //         )
  //       : false),
  //   [challenge.participants, currentUser, status]
  // )

  const { mutate: mutateGetAChallengeWinner } = useMutation(
    getAllChallengeWinners
  )

  const { mutate: mutateFilterPaidChallenges } =
    useMutation(filterPaidChallenges)

  const handleJoin = useCallback(() => {
    setOpenAcceptModal(true)
  }, [])

  const handleAgree = useCallback(() => {
    setLoading(true)
    jwtDecode(localStorage.getItem('token')).then((res) => {
      const pKey = res?.private_key
      decryptMnemonic(pKey, secretKey).then((res) => {
        console.log(res)
        if (res)
          toast.success(
            'Please keep patience while your transaction is being processing'
          )
        sendFundsToEscrow(res, betAmount).then((res1) => {
          if (res1 === 'Charge your account!') {
            toast.error(
              'You do not have enough funds to perform this transaction'
            )
            setLoading(false)
          } else {
            toast.success('Amount Successfully Transfered')
            mutateJoinChallenge(
              {
                data: {
                  username: currentUser?.username,
                  participant: challenge?.participant,
                  bet: parseFloat(betAmount),
                  challenge_id: id,
                },
              },
              {
                onSuccess: () => {
                  setLoading(false)
                  reload()
                },
                onError: () => {
                  toast.error(`Can't join the challenge.`)
                },
              }
            )
          }
        })
      })
    })
  }, [challenge, betAmount])

  const reload = useCallback(() => {
    if (id) {
      mutateGetChallenge(id, {
        onSuccess: ({ data }) => {
          setChallenge(data.data)
          setLoading(false)
        },
        onError: () => {
          toast.error(`Can't get challenge.`)
        },
      })
    } else {
      setLoading(false)
    }
  }, [id, setLoading, mutateGetChallenge])

  const handleSubmit = useCallback(
    (values) => {
      mutatePostSteps(
        {
          steps_count: values?.count,
          steps_distance: JSON.stringify(values?.distance),
          challenge_id: id,
        },
        {
          onSuccess: ({ data }) => {
            console.log(data)
          },
          onError: (error) => {
            toast.error(error)
          },
        }
      )
    },
    [id, mutatePostSteps]
  )

  const validationSchema = Yup.object().shape({
    minBet: Yup.number().min(
      minBet,
      'Minimum bet amount must be greater than origal bet price'
    ),
  })

  const handleBet = useCallback((values) => {
    console.log(values)
    // mutateUpdateChallenge(
    //   { id, data },
    //   {
    //     onSuccess: () => {
    //       setDisable(false)
    //       history.push('/challenges')
    //     },
    //     onError: () => {
    //       setDisable(false)
    //       toast.error(`Can't update the challenge.`)
    //     },
    //   }
    // )
  }, [])

  const handlePayouts = useCallback(() => {
    setLoading(true)
    toast.success(
      'Please wait while the funds are being transferring to the winners of this challenge. It takes upto 2-3 minutes approx'
    )
    mutateGetAChallengeWinner(
      {
        id: id,
      },
      {
        onSuccess: async ({ data }) => {
          if (data?.data && data?.data?.length)
            for (const element of data?.data || []) {
              try {
                const res = await sendFundsToChallengeWinners(element)
                console.log(res)
                results.push(res)
              } catch (error) {
                console.error('Error processing challenge:', error)
              }
            }

          console.log(results)
          results.forEach((element) => {
            if (element?.transactionId && element?.challengeId)
              mutateFilterPaidChallenges(
                { id: element?.challengeId },
                {
                  onSuccess: ({ data }) => {
                    if (data) {
                      toast.success('Payment has been succesfully made.')
                      reload()
                    }
                  },
                  onError: () => {
                    toast.error(`Unexceptional Error`)
                  },
                }
              )
          })
        },
        onError: () => {
          toast.error(`Unexceptional Error`)
        },
      }
    )
  }, [id, mutateFilterPaidChallenges, mutateGetAChallengeWinner])

  return React.useMemo(() => {
    return (
      <Container maxWidth='md' className={classes.container}>
        <PageWrapper display='flex' flexDirection='row'>
          <Box display='flex' alignItems='justify-between' flexDirection='row'>
            <Box display='flex' alignItems='center' flexDirection='column'>
              <Typography variant='h3'>
                <strong>Steps</strong>
              </Typography>
              <Box mb={3} />
              <Formik
                initialValues={initialValues}
                onSubmit={handleSubmit}
                enableReinitialize
              >
                {({ values, touched, errors, handleChange }) => {
                  return (
                    <Form autoComplete='off'>
                      <Grid
                        container
                        justifyContent='center'
                        display='flex'
                        spacing={2}
                      >
                        <Grid item xs={12} sm={9}>
                          <TextField
                            label='Steps Count'
                            variant='outlined'
                            name='count'
                            type='number'
                            error={Boolean(touched.count && errors.count)}
                            helperText={touched.count && errors.count}
                            value={values.count}
                            onChange={handleChange}
                          />
                        </Grid>

                        <Grid item xs={12} sm={9}>
                          <TextField
                            label='Steps Distance'
                            variant='outlined'
                            name='distance'
                            type='number'
                            error={Boolean(touched.distance && errors.distance)}
                            helperText={touched.distance && errors.distance}
                            value={values.distance}
                            onChange={handleChange}
                          />
                        </Grid>

                        <Grid item>
                          <Button
                            variant='contained'
                            color='primary'
                            type='submit'
                            fullWidth
                            size='large'
                            disabled={false}
                          >
                            {'Add Steps'}
                          </Button>
                        </Grid>
                      </Grid>
                    </Form>
                  )
                }}
              </Formik>
            </Box>
            <Box display='flex' alignItems='center' flexDirection='column'>
              {loading ? (
                <CircularProgress />
              ) : (
                <>
                  <Typography variant='h3'>
                    <strong>{challenge?.name}</strong>
                  </Typography>
                  <Box mb={3} />
                  {status === STATUS_UPCOMING && (
                    <Chip label='UPCOMING' color='secondary' />
                  )}
                  {status === STATUS_STARTED &&
                    !challenge?.fund_delivered_flag && (
                      <Chip label='ACTIVE' color='primary' />
                    )}
                  {status === STATUS_ENDED &&
                    challenge?.fund_delivered_flag && (
                      <Chip label='Already Ended.' />
                    )}
                  {!challenge?.fund_delivered_flag && (
                    <Typography variant='h5'>
                      {`${liveTime.days} Day${liveTime.days > 1 ? 's' : ''} ${
                        liveTime.hours
                      } h ${liveTime.minutes} min ${liveTime.seconds} s`}
                    </Typography>
                  )}

                  <Box mt={4}>
                    <Typography variant='h6'>
                      Total Participants:&nbsp;
                      {challenge?.participant
                        ? challenge?.participant.length
                        : 0}
                    </Typography>
                  </Box>
                  <Box mt={4}>
                    <Typography variant='h6'>
                      Coordinator:&nbsp;
                      <Link href={`/profile/${challenge?.coordinator}`}>
                        {challenge?.coordinator}
                      </Link>
                    </Typography>
                  </Box>
                  {status === STATUS_ENDED && <>Success Rate: 0</>}
                  <Box mt={4} width={400} maxWidth='100%'>
                    <Formik
                      initialValues={{ betAmount }}
                      onSubmit={handleAgree}
                      validationSchema={validationSchema}
                      enableReinitialize
                    >
                      {({ values, touched, errors, handleChange }) => {
                        const handleChangeAndSetBetAmount = (e) => {
                          handleChange(e)
                          setBetAmount(e.target.value)
                        }
                        return (
                          <Form autoComplete='off'>
                            <Grid
                              container
                              justifyContent='center'
                              display='flex'
                              spacing={2}
                            >
                              {status !== STATUS_ENDED &&
                              localStorage.getItem('identity') !==
                                challenge?.coordinator &&
                              !challenge?.fund_delivered_flag ? (
                                <>
                                  <Grid item xs={12} sm={9}>
                                    <Field name='minBet' type='number'>
                                      {({ field }) => (
                                        <div>
                                          <TextField
                                            {...field}
                                            type='number'
                                            label='Add Bet'
                                            variant='outlined'
                                            onChange={
                                              handleChangeAndSetBetAmount
                                            }
                                            value={betAmount}
                                            error={
                                              touched.minBet &&
                                              Boolean(errors.minBet)
                                            }
                                            helperText={
                                              touched.minBet && errors.minBet
                                            }
                                          />
                                          {values.betAmount <
                                            challenge?.add_bet && (
                                            <p style={{ color: 'red' }}>
                                              {`Minimum bet amount must be greater than
                                          or equal to ${challenge?.add_bet}`}
                                            </p>
                                          )}
                                        </div>
                                      )}
                                    </Field>
                                    <Box mb={3} />
                                  </Grid>
                                  <Button
                                    variant='contained'
                                    color='primary'
                                    fullWidth
                                    disabled={
                                      Boolean(errors.minBet) ||
                                      challenge?.participant?.includes(
                                        currentUser?.identity
                                      )
                                    }
                                    size='large'
                                    onClick={handleJoin}
                                  >
                                    Join
                                  </Button>
                                </>
                              ) : localStorage.getItem('identity') ===
                                  challenge?.coordinator &&
                                !challenge?.fund_delivered_flag ? (
                                <>
                                  <Grid item xs={12} sm={9}>
                                    <Field name='minBet' type='number'>
                                      {({ field }) => (
                                        <div>
                                          <TextField
                                            {...field}
                                            type='number'
                                            label='Add Bet'
                                            variant='outlined'
                                            onChange={
                                              handleChangeAndSetBetAmount
                                            }
                                            value={betAmount}
                                            error={
                                              touched.minBet &&
                                              Boolean(errors.minBet)
                                            }
                                            helperText={
                                              touched.minBet && errors.minBet
                                            }
                                          />
                                          {values.betAmount <
                                            challenge?.add_bet && (
                                            <p style={{ color: 'red' }}>
                                              {`Minimum bet amount must be greater than
                                          or equal to ${challenge?.add_bet}`}
                                            </p>
                                          )}
                                        </div>
                                      )}
                                    </Field>
                                    <Box mb={3} />
                                  </Grid>
                                  <Button
                                    variant='contained'
                                    color='primary'
                                    fullWidth
                                    disabled={
                                      Boolean(errors.minBet) ||
                                      challenge?.participant?.includes(
                                        currentUser?.identity
                                      )
                                    }
                                    size='large'
                                    onClick={handleJoin}
                                  >
                                    Join
                                  </Button>

                                  <Button
                                    variant='contained'
                                    color='primary'
                                    fullWidth
                                    size='large'
                                    disabled={!challenge?.participant?.length}
                                    onClick={handlePayouts}
                                  >
                                    Send Payouts
                                  </Button>
                                </>
                              ) : (
                                challenge?.fund_delivered_flag && (
                                  <Typography variant='h6'>Paid</Typography>
                                )
                              )}
                            </Grid>
                          </Form>
                        )
                      }}
                    </Formik>
                  </Box>
                </>
              )}
            </Box>
          </Box>
        </PageWrapper>
        <ChallengeAcceptModal
          open={openAcceptModal}
          setOpen={setOpenAcceptModal}
          onAgree={handleAgree}
        />
      </Container>
    )
  }, [
    challenge,
    classes.container,
    currentUser,
    handleAgree,
    handleBet,
    handleJoin,
    handleSubmit,
    betAmount,
    liveTime,
    loading,
    openAcceptModal,
    status,
    validationSchema,
  ])
}
