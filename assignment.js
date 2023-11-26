const{google}=require("googleapis");
const {
    CLIENT_ID,
    CLIENT_SECRET,
    REDIRECT_URI,
    REFRESH_TOKEN,
}=require("./examplle");
const oAuth2Client=new google.auth.OAuth2(
    CLIENT_ID,
    CLIENT_SECRET,
    REDIRECT_URI
);
oAuth2Client.setCredentials({refresh_token:REFRESH_TOKEN});
const repliedUsers=new set();
async function checkEmailAndSendReplies(){
    try{
        const gmail=google.gmail({version:"v1",auth:oAuth2Client});
        const res=await gmail.users.messages.list({
            userId:"me",
            q:"is:unread",
        });
        const messages=res.data.messages;
        if(messages&&messages.length>0){
            for(const messages of messages){
                const email=await gmail.users.messages.get({
                    userId:"me",
                    id:messages.id,
                });
                const from=email.data.payload.headers.find(
                    (header)=>header.name==="From"
                );
                const toHeader=email.data.payload.headers.find(
                    (header)=>header.name==="To"
                    );
                const Subject=email.data.payload.headers.find(
                    (header)=>header.name==="subject"
                );
                const From=from.value;
                const toEmail=toHeader.value;
                const subject=Subject.value;
                console.log("email from",From);
                console.log("To email",toEmail);
                if(repliedUsers.has(From)){
                    console.log("Already replied to :",From);
                    continue;
                }
                const thread=await gmail.users.threads.get({
                    userId:"me",
                    id:message.threadId,
                });
                const replies=thread.data.messages.slice(1);
                if(replies.length===0){
                    await gmail.users.messages.send({
                        userId:"me",
                        requestBody:{
                            raw:await createReplyRaw(toEmail,From,subject),
                        },
                    });
                    const labelName="onVacation";
                    await gmail.users.messages.modify({
                        userId:"me",
                        id:message.id,
                        requestBody:{
                            addLabelIds:[await createLabelIfNeede(labelName)]
                        },
                    });
                    console.log("send reply to email:",From);
                    repliedUsers.add(From);
                }
            }
        }
    }catch(error){
        console.error("Error occured:",error);
    }
}
async function createReplyRaw(from,to,subject){
    const emailContent=`From: ${from}\nTo: ${to}\mSubject: ${subject}\n\n Thankyou for your message.i am unable right now,but i will respond as soon as possibel`;
    const base64EncodedEmail=Buffer.from(emailContent)
      .toString("base64")
      .replace(/\\+/g,"-")
      .replace(/\//g,"_");
    return base64EncodedEmail;
}
async function createLabelIfNeede(labelName){
    const gmail=google.gmail({version:"v1",auth:oAuth2Client});
    const res=await gmail.users.labels.list({userId:"me"});
    const labels=res.data.labels;

    const existingLabel=labels.find((label)=>label.name===labelName);
    if(existingLabel){
        return existingLabel.id;
    }
    const newlabel=await gmail.users.labels.create({
        userId:"me",
        requestBody:{
            name:labelName,
            labelListVisibility:"labelshow",
            messageListVisibility:"show",
        },
    });
    return newlabel.data.id;
}
function getRandomInterval(min,max){
    return Math.floor(Math.random()*(max-min+1)+min);
}
setInterval(checkEmailAndSendReplies,getRandomInterval(45,120)*1000);