import { useState } from 'react';

export const apiRequester = async ({url, method = 'GET', data = null}) => {
  const options = {method: method, headers: {}}
  if (data) {
    options.body = JSON.stringify(data);
    options.headers['Content-Type'] = 'application/json';
  }
  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      throw new Error(response.statusText);
    }
    const data = await response.json();
    data._headers = response.headers;
    return data;
  } catch (error) {
    console.error(error);
    return null;
  }
}

export const getOrdinal = n => {
  let ord = 'th';
  if (n % 10 == 1 && n % 100 != 11) {
    ord = 'st';
  }
  else if (n % 10 == 2 && n % 100 != 12) {
    ord = 'nd';
  }
  else if (n % 10 == 3 && n % 100 != 13) {
    ord = 'rd';
  }
  return `${n}${ord}`;
}
  
export const calculateAverage = (stat, player) => {
  if (player.games == 0) {
    return 0;
  }
  let total;
  if (stat == 'disposals') {
    total = player.kicks + player.handballs;
  } else {
    total = player[stat];
  }
  return Math.round(10 * total / player.games) / 10;
}

export const getRoundName = (season, round, short) => {
  let numHomeAndAway = 22;
  let finalRound = 23;
  if (season == 2020) {
    numHomeAndAway = 17;
    finalRound = 18;
  } else if (season >= 2023) {
    numHomeAndAway = 23;
    finalRound = 24;
  }
  if (round <= finalRound) {
    return short ? `R${round}` : `Round ${round}`;
  }
  switch (round) {
    case finalRound + 1:
      return short ? 'FW1' : 'Finals Week 1'
    case finalRound + 2:
      return short ? 'SF' :'Semi Final'
    case finalRound + 3:
      return short ? 'PF' :'Preliminary Final'
    case finalRound + 4:
      return short ? 'GF' :'Grand Final'
  }
}

export const formatMatchTime = timeStr => {
  if (!timeStr) {
    return '00:00';
  }
  let [minutesStr, secondsStr] = timeStr.split(':');
  if (minutesStr.length === 1) {
    minutesStr = '0' + minutesStr;
  }
  if (secondsStr.length === 1) {
    secondsStr = '0' + secondsStr;
  }
  return minutesStr + ':' + secondsStr;
}

export const formatLiveText = match => {
  switch (true) {
    case match.percent_complete < 25:
      return ` (Q1 ${formatMatchTime(match.time)})`;
    case match.percent_complete === 25:
      return ' (QT)';
    case match.percent_complete < 50:
      return ` (Q2 ${formatMatchTime(match.time)})`;
    case match.percent_complete === 50:
      return ' (HT)';
    case match.percent_complete < 75:
      return ` (Q3 ${formatMatchTime(match.time)})`;
    case match.percent_complete === 75:
      return ' (3QT)';
    case match.percent_complete < 100:
      return ` (Q4 ${formatMatchTime(match.time)})`;
    default:
      return '';
  }
}

export class BaseChartOptions {
  responsive = true;
  maintainAspectRatio = false;
  plugins = {
    legend: {
      position: 'top',
    },
  }
  pointRadius = 4;
  pointHoverRadius = 8;
}

export const chartColours = ['red', 'blue', 'gold', 'green', 'magenta', 'orange', 'cyan'];
const visibleDatasets = ['disposals', 'marks', 'tackles', 'hitouts'];
const hiddenDatasets = ['kicks', 'handballs', 'goals'];
export class BaseChartData {
  labels = [];
  datasets = [...visibleDatasets, ...hiddenDatasets].map((x, i) => ({
    label: x,
    data: [],
    backgroundColor: chartColours[i],
    hidden: hiddenDatasets.includes(x),
  }));
}