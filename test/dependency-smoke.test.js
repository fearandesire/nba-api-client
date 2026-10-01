const assert = require('node:assert/strict');
const test = require('node:test');
const axios = require('axios');
const api = require('../index');

test('Axios-backed schedule and stats requests retain their response shape', async () => {
  const originalGet = axios.get;
  const calls = [];
  axios.get = async (url) => {
    calls.push(url);
    if (url.includes('full_schedule_week.json')) return { data: { games: [1] } };
    return { data: { parameters: { TeamID: 1 }, resultSets: [{ name: 'Team', headers: ['TEAM_ID'], rowSet: [[1]] }] } };
  };
  try {
    assert.deepEqual(await api.schedule(2026), { games: [1] });
    assert.deepEqual(await api.teamDetails({ TeamID: 1 }), { Team: { TEAM_ID: 1 } });
    assert.match(calls[0], /2026\\/league\\/00_full_schedule_week\\.json$/);
    assert.match(calls[1], /TeamID=1/);
  } finally {
    axios.get = originalGet;
  }
});

test('xmldom still parses the video XML response', async () => {
  const originalGet = axios.get;
  axios.get = async (url) => url.includes('videoevents')
    ? { data: { resultSets: { Meta: { videoUrls: [{ uuid: 'test-video' }] } } } }
    : { data: '<video><file>0</file><file>1</file><file>2</file><file>3</file><file>4</file><file>video.mp4</file></video>' };
  try {
    assert.equal(await api.getPBPVideoURL({ EventNum: 1, GameID: 'game' }), 'video.mp4');
  } finally {
    axios.get = originalGet;
  }
});
