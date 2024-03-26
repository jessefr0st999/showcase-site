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