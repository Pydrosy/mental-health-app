const { RtcTokenBuilder, RtcRole } = require('agora-access-token');

const generateAgoraToken = (channelName, uid = 0, role = RtcRole.PUBLISHER) => {
  const appId = process.env.AGORA_APP_ID;
  const appCertificate = process.env.AGORA_APP_CERTIFICATE;
  
  if (!appId || !appCertificate) {
    console.warn('Agora credentials not configured');
    return null;
  }

  const expirationTimeInSeconds = 3600; // 1 hour
  const currentTimestamp = Math.floor(Date.now() / 1000);
  const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

  const token = RtcTokenBuilder.buildTokenWithUid(
    appId,
    appCertificate,
    channelName,
    uid,
    role,
    privilegeExpiredTs
  );

  return token;
};

module.exports = { generateAgoraToken };