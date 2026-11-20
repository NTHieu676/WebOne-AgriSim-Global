const { Timestamp } = require("firebase-admin/firestore");
const { db } = require("../config/firebaseAdmin");

function users() {
    return db.collection("users");
}

function serialize(snapshot) {
    const data = snapshot.data();

    return {
        uid: snapshot.id,
        displayName: data.displayName || null,
        email: data.email || null,
        createdAt: data.createdAt ? data.createdAt.toDate().toISOString() : null,
        updatedAt: data.updatedAt ? data.updatedAt.toDate().toISOString() : null
    };
}

async function getByUid(uid) {
    const snapshot = await users().doc(uid).get();
    return snapshot.exists ? serialize(snapshot) : null;
}

async function createIfMissing({ uid, displayName, email }) {
    const reference = users().doc(uid);
    const now = Timestamp.now();

    const created = await db.runTransaction(async (transaction) => {
        const snapshot = await transaction.get(reference);
        if (snapshot.exists) return false;

        transaction.create(reference, {
            displayName,
            email,
            createdAt: now,
            updatedAt: now
        });
        return true;
    });

    return {
        created,
        player: await getByUid(uid)
    };
}

module.exports = {
    getByUid,
    createIfMissing
};
