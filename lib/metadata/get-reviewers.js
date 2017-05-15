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
    
    // Special-case @Joanmarie because GH-API can't handle mix-cased usernames.
    reviewers = reviewers.filter(function(login) {
        return login.toLowerCase() != "joanmarie";
    });
    
    return reviewers.filter(function(login) {
        return metadata.reviewers.indexOf(login) < 0;
    });
}