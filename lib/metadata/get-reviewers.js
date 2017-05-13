module.exports = function getReviewers(metadata) {
    var reviewers = metadata.ownersExcludingAuthor.map(function(owner) {
        return owner.login
    });
    
    if (metadata.isRoot) {
        metadata.rootReviewers.forEach(function(rR) {
            if (rR != metadata.author.login && reviewers.indexOf(rR) < 0) {
                reviewers.push(rR);
            }
        });
    }
    
    return reviewers.filter(function(login) {
        return metadata.reviewers.indexOf(login) < 0;
    });
}