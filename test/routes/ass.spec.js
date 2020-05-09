module.exports = {
    groupName: 'Test cases group name',
    testCases: [
        {
            name: 'Test case name',
            stubbings: {
                'functionName': 'resolveValue',
            },
            url: '',
            method: 'POST',
            headers: { 'key': 'value' },
            body: { 'key': 'value' },
            expect: {
                statusCode: 200,
                responseBody: {},
            },
        },
    ],
}