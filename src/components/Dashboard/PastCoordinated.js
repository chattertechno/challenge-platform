import React, { useMemo } from 'react'
import {
  List,
  ListItem,
  ListItemText,
  Chip,
  Grid,
  Typography,
} from '@material-ui/core'
import { makeStyles } from '@material-ui/styles'
import PropTypes from 'prop-types'

import { useHistory } from 'react-router'
import { convertFromUTC } from 'utils/date'
import PageWrapper from '../common/PageWrapper/PageWrapper'

const useStyles = makeStyles((theme) => ({
  chip: {
    marginLeft: theme.spacing(1),
  },
  alignCenter: {
    textAlign: 'center',
  },
}))

export default function PastCoordinated(props) {
  const history = useHistory()
  const classes = useStyles()
  const { user, challenges } = props

  const data = useMemo(
    () =>
      challenges?.filter(
        (challenge) =>
          challenge.end_date &&
          convertFromUTC(challenge.end_date) < new Date() &&
          challenge.coordinator === user.username
      ),
    [challenges, user.username]
  )

  const totalParticipants = useMemo(
    () =>
      data?.reduce(
        (sum, current) =>
          sum + (current.participants ? current.participants.length : 0),
        0
      ),
    [data]
  )

  const successRate = useMemo(
    () =>
      data?.length > 0
        ? (
            (data.filter((item) => item.success === true).length /
              data.length) *
            100
          ).toFixed(0)
        : 0,
    [data]
  )
  //console.log(data)
  const onOpen = React.useCallback(
    (id) => {
      //console.log(id)
      history.push(`/challenge/${id}`)
    },
    [history]
  )

  return (
    <PageWrapper title='Past Coordinated Challenges'>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6} container spacing={2} direction='column'>
          <Grid item>
            <Typography variant='h5' className={classes.alignCenter}>
              Total Participants:
            </Typography>
          </Grid>
          <Grid item>
            <Typography variant='h4' className={classes.alignCenter}>
              <strong>{totalParticipants}</strong>
            </Typography>
          </Grid>
          <Grid item>
            <Typography variant='h5' className={classes.alignCenter}>
              Success Rate:
            </Typography>
          </Grid>
          <Grid item>
            <Typography variant='h4' className={classes.alignCenter}>
              <strong>{successRate}%</strong>
            </Typography>
          </Grid>
        </Grid>
        <Grid item xs={12} sm={6}>
          <List>
            {data?.map((item, index) => (
              <ListItem button key={`challenge-${index}`}>
                {item.success ? (
                  <>
                    <ListItemText primary={item.name} />
                    <Chip
                      label='Succeed'
                      color='primary'
                      className={classes.chip}
                    />
                  </>
                ) : (
                  <>
                    <ListItemText primary={item.name} />
                    <Chip
                      label='Failed'
                      color='secondary'
                      //variant='outlined'
                      className={classes.chip}
                      onClick={() => onOpen(item._id)}
                    />
                  </>
                )}
              </ListItem>
            ))}
          </List>
        </Grid>
      </Grid>
    </PageWrapper>
  )
}

PastCoordinated.propTypes = {
  challenges: PropTypes.arrayOf(PropTypes.any),
  user: PropTypes.any,
}
