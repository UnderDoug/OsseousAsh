exports.IDsByToken = {};
exports.TokenTimestamps = {};

exports.allow = (req, res, next) => {
    try {
        req.token = crypto.randomUUID();
        this.IDsByToken[req.token] = req.body.BonesID;
        this.TokenTimestamps[req.token] = Date.now();
        console.log('BonesID:', req.body.BonesID, 'token:', req.token);
        next();
    } catch {
        {
            console.log('Failed to create token for follow up SavGz PUT');
            res.status(500).json({
                error: 'Failed to create token for follow up SavGz PUT'
            });
        }
    }
};

exports.check = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
        console.log('No authorization header provided');
        return res.status(401).json({
            error: 'No authorization header provided'
        });
    }

    if (authHeader !== req.params.BonesID) {
        console.log('No authorization header provided');
        return res.status(401).json({
            error: 'Authorization token for wrong BonesID'
        });
    }

    const token = tokens[authHeader];
    if (!token) {
        console.log('Authorization token invalid');
        return res.status(401).json({
            error: 'Authorization token invalid'
        });
    }

    const checkValue = Date.now() - token;
    if (checkValue > 300000) {
        console.log('Authorization token expired');
        return res.status(401).json({
            error: 'Authorization token expired'
        });
    }

    try {
        req.token = authHeader;
        next();
    } catch {
        console.log('Failed to assign token to request');
        res.status(500).json({
            error: 'Failed to assign token to request'
        });
    }
};