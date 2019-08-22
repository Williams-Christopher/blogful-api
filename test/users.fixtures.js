function makeUsersArray() {
    return [
        {
            id: 1,
            date_created: '2029-01-22T16:28:00.000Z',
            fullname: 'Sam Gamgee',
            username: 'sam.gamgee@shire.com',
            password: 'secret',
            nickname: 'Sam',
        },
        {
            id: 2,
            date_created: '2100-12-22T16:28:00.000Z',
            fullname: 'Perrigrin Took',
            username: 'peregrin.took@shire.com',
            password: 'secret2',
            nickname: 'Pippin',
        },
    ];
};

module.exports = {
    makeUsersArray,
};
