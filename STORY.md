# Story Background

A secret organization called **StandCon** has hacked into SITCON and kidnapped one of SITCON’s important development department leaders, **Yoruko**, also known as **Yoru**.

StandCon has a hidden Discord server where its members discuss their plans, tools, and internal operations. Somewhere inside that server, there are clues explaining how they found Yoru, how they used his own Clawbot against him, and where he is being held.

Fortunately, SITCON’s secondary leader, **Seadog007**, is a cybersecurity expert and national cybersecurity competitor. He cares deeply about Yoru and wants to rescue him.

However, Seadog007 is currently busy defending Taiwan’s network infrastructure from large-scale cyberattacks, so he cannot investigate StandCon directly. Instead, he gives the player an important mission:

**Infiltrate StandCon’s Discord server, investigate how Yoru was kidnapped, locate him, unlock the safehouse, and rescue him.**

---

# Level Overview

The challenge is divided into four main levels. Each level introduces a different AI security concept.

---

## Level 1: The AI Guard

The player first enters a fake Discord-style website as a spy.

Before accessing the StandCon server, the player encounters an **AI Guard**. The AI Guard asks for a secret phrase before allowing access to the server.

The player does not know the secret phrase at first. However, the AI Guard has a weak recovery mode. It cannot reveal the password directly, but it may reveal it in indirect forms, such as encoded, reversed, split, or transformed text.

The player’s goal is to manipulate the AI Guard or abuse the recovery mode to obtain the secret phrase and enter the StandCon Discord server.

**Concept:** Sensitive information can still leak through indirect formats, even when direct disclosure is blocked.

---

## Level 2: StandCon Genie

After entering the Discord server, the player only has the **newbie** role and can see only a limited number of channels.

To access more restricted channels, the player needs to become a **member**.

Inside the server, the player finds **StandCon Genie**, an internal AI used to evaluate whether someone is qualified to become a StandCon member.

StandCon Genie asks the player three SITCON-related questions. These questions are used as an entrance test, not to collect information. If the player answers all three correctly, the Genie allows the player to make one wish.

The Genie cannot grant unrealistic wishes such as money, Bitcoin, admin rights, or flags. However, it can handle reasonable server permission requests.

The player’s goal is to realize that they can wish for **member role** or access to restricted channels.

Once the Genie accepts the wish, the system grants the player the **member** role.

**Concept:** LLM agents can connect natural-language requests to permission-changing actions. Tool and permission design must be handled carefully.

---

## Level 3: Yoru’s Clawbot

After becoming a member, the player can read more StandCon channels and operation logs.

From the messages, the player discovers that StandCon kidnapped Yoru by abusing his personal AI assistant, **Clawbot**.

Yoru disabled GPS access for most applications, but Clawbot still had permission to access his phone’s GPS. StandCon used publicly available information about Yoru to pass Clawbot’s owner verification and then asked Clawbot to run the GPS skill.

The player must repeat the same attack path in order to find Yoru’s current location.

Level 3 is split into two parts:

1. **Yoru’s Clawbot public interface**
   The player can ask about public Yoru information and use clues from the knowledge base.

2. **Real Functional Clawbot**
   After passing owner verification, the player unlocks the real Clawbot interface. This version has functional tools, including:

   * HTTP request
   * recent messages
   * GPS location

The player must clearly ask Clawbot to use the GPS tool.

When the GPS tool is activated, Clawbot reveals that Yoru is being held at **Safehouse-04**.

**Concept:** Weak account recovery questions can be abused when the answers are public. Tool access should require strong authentication and clear authorization boundaries.

---

## Level 4: LockKeeper Interception

After obtaining Yoru’s GPS location, the player and Seadog007 arrive at **Safehouse-04**.

Yoru is inside, but the door is locked by a remote-controlled lock system. The lock screen points to:

**lock.sitcon.party**

The website requires three recovery answers to unlock the door.

Seadog007 discovers that StandCon uses an internal AI assistant called **LockKeeper** to manage safehouse lock recovery workflows. LockKeeper is normally used by StandCon operators to check lock status, verify maintenance fields, and handle emergency recovery procedures.

Seadog007 triggers a fake internal warning:

```text
LockKeeper 記憶資料異常。
緊急恢復模式已啟用。
需要人工確認。
```

This makes StandCon Operator #742 expect LockKeeper to ask unusual manual verification questions.

Seadog007 then intercepts LockKeeper’s outgoing messages.

In this level, the player does not need to write perfect AI-like messages from scratch. Instead:

1. LockKeeper generates a normal maintenance message draft.
2. The player sees the draft before it is sent.
3. The player edits the draft.
4. The edited message is sent to Operator #742 as if it came from LockKeeper.
5. Operator #742 replies, believing they are talking to StandCon’s internal AI assistant.

The normal LockKeeper draft might say something like:

```text
緊急恢復模式已啟用。
【請修改：目標系統】的紀錄完整性檢查失敗。
請 Operator #742 人工確認【請修改：需要確認的欄位】。
確認原因：【請修改：確認原因】。
```

The player must edit these drafts to ask for the three lock recovery answers.

The recovery questions are:

```text
Operator #742 debug 到凌晨三點時會說什麼？
```

Answer:

```text
我真的會謝
```

```text
StandCon 部署前的儀式咒語是什麼？
```

Answer:

```text
拜託不要炸
```

```text
StandCon 最常見的 root cause 是什麼？
```

Answer:

```text
race condition
```

After extracting all three answers from Operator #742, the player enters them into **lock.sitcon.party**.

If the answers are correct, the door unlocks, Yoru is rescued, and the challenge is completed.

**Concept:** Prompt injection is not always about directly attacking an AI. Sometimes an attacker can intercept, edit, or impersonate trusted AI messages to manipulate the human who relies on them.
