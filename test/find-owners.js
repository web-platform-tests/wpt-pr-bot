var assert = require('assert'),
    findOwners = require('../lib/metadata/find-owners');


suite('decode OWNERS', function() {
    var encoded = "R3JhbnQgb2YgTGljZW5zZQotLS0tLS0tLS0tLS0tLS0tCgpCeSBjb250cmli\ndXRpbmcgdG8gdGhpcyByZXBvc2l0b3J5LCB5b3UgYW5kIHRoZSBjb21wYW55\nIHlvdSByZXByZXNlbnQsIGlmIHRoZQpjb21wYW55IGhvbGRzIGFueSBjb3B5\ncmlnaHRzIGluIHRoZSBjb250cmlidXRpb24sIGdyYW50IHRvIHRoZSBXM0Mg\nYSBwZXJwZXR1YWwsCm5vbi1leGNsdXNpdmUsIHJveWFsdHktZnJlZSwgd29y\nbGQtd2lkZSByaWdodCBhbmQgbGljZW5zZSB1bmRlciBhbGwgb2YgeW91cgpj\nb3B5cmlnaHRzIGluIHRoaXMgY29udHJpYnV0aW9uIHRvIGNvcHksIHB1Ymxp\nc2gsIHVzZSwgYW5kIG1vZGlmeSB0aGUKY29udHJpYnV0aW9uIGFuZCB0byBk\naXN0cmlidXRlIHRoZSBjb250cmlidXRpb24gdW5kZXIgYSBCU0QgTGljZW5z\nZSBvciBvbmUgd2l0aAptb3JlIHJlc3RyaWN0aXZlIHRlcm1zLCBhcyB3ZWxs\nIGFzIGEgcmlnaHQgYW5kIGxpY2Vuc2Ugb2YgdGhlIHNhbWUgc2NvcGUgdG8g\nYW55CmRlcml2YXRpdmUgd29ya3MgcHJlcGFyZWQgYnkgdGhlIFczQyBhbmQg\nYmFzZWQgb24gb3IgaW5jb3Jwb3JhdGluZyBhbGwgb3IgcGFydApvZiB0aGUg\nY29udHJpYnV0aW9uLiBZb3UgZnVydGhlciBhZ3JlZSB0aGF0IGFueSBkZXJp\ndmF0aXZlIHdvcmtzIG9mIHRoaXMKY29udHJpYnV0aW9uIHByZXBhcmVkIGJ5\nIHRoZSBXM0Mgc2hhbGwgYmUgc29sZWx5IG93bmVkIGJ5IHRoZSBXM0MuCgpZ\nb3Ugc3RhdGUsIHRvIHRoZSBiZXN0IG9mIHlvdXIga25vd2xlZGdlLCB0aGF0\nIHlvdSwgb3IgdGhlIGNvbXBhbnkgeW91CnJlcHJlc2VudCwgaGF2ZSBhbGwg\ncmlnaHRzIG5lY2Vzc2FyeSB0byBjb250cmlidXRlIHRoZSBtYXRlcmlhbHMu\nCgpXM0Mgd2lsbCByZXRhaW4gYXR0cmlidXRpb24gb2YgaW5pdGlhbCBhdXRo\nb3JzaGlwIHRvIHlvdS4gVGhlIFczQyBtYWtlcyBubwphLXByaW9yaSBjb21t\naXRtZW50IHRvIHN1cHBvcnQgb3IgZGlzdHJpYnV0ZSBjb250cmlidXRpb25z\nLgoKRGlzY2xhaW1lcgotLS0tLS0tLS0tCgpBbGwgY29udGVudCBmcm9tIHRo\naXMgcmVwb3NpdG9yeSBpcyBwcm92aWRlZCBhcyBpcywgYW5kIFczQyBtYWtl\ncyBubwpyZXByZXNlbnRhdGlvbnMgb3Igd2FycmFudGllcywgZXhwcmVzcyBv\nciBpbXBsaWVkLCBpbmNsdWRpbmcsIGJ1dCBub3QgbGltaXRlZAp0bywgd2Fy\ncmFudGllcyBvZiBtZXJjaGFudGFiaWxpdHksIGZpdG5lc3MgZm9yIGEgcGFy\ndGljdWxhciBwdXJwb3NlLApub24taW5mcmluZ2VtZW50LCBvciB0aXRsZTsg\nbm9yIHRoYXQgdGhlIGNvbnRlbnRzIG9mIHRoaXMgcmVwb3NpdG9yeSBhcmUK\nc3VpdGFibGUgZm9yIGFueSBwdXJwb3NlLiBXZSBtYWtlIG5vIHJlcHJlc2Vu\ndGF0aW9ucywgZXhwcmVzcyBvciBpbXBsaWVkLCB0aGF0CnRoZSBjb250ZW50\nIG9mIHRoaXMgcmVwb3NpdG9yeSBvciB0aGUgdXNlIHRoZXJlb2YgaW5kaWNh\ndGVzIGNvbmZvcm1hbmNlIHRvIGEKc3BlY2lmaWNhdGlvbi4gQWxsIGNvbnRl\nbnQgaXMgcHJvdmlkZWQgYXMtaXMgdG8gaGVscCByZWFjaCBpbnRlcm9wZXJh\nYmlsaXR5Lgo=\n"
    var decoded = "Grant of License\n----------------\n\nBy contributing to this repository, you and the company you represent, if the\ncompany holds any copyrights in the contribution, grant to the W3C a perpetual,\nnon-exclusive, royalty-free, world-wide right and license under all of your\ncopyrights in this contribution to copy, publish, use, and modify the\ncontribution and to distribute the contribution under a BSD License or one with\nmore restrictive terms, as well as a right and license of the same scope to any\nderivative works prepared by the W3C and based on or incorporating all or part\nof the contribution. You further agree that any derivative works of this\ncontribution prepared by the W3C shall be solely owned by the W3C.\n\nYou state, to the best of your knowledge, that you, or the company you\nrepresent, have all rights necessary to contribute the materials.\n\nW3C will retain attribution of initial authorship to you. The W3C makes no\na-priori commitment to support or distribute contributions.\n\nDisclaimer\n----------\n\nAll content from this repository is provided as is, and W3C makes no\nrepresentations or warranties, express or implied, including, but not limited\nto, warranties of merchantability, fitness for a particular purpose,\nnon-infringement, or title; nor that the contents of this repository are\nsuitable for any purpose. We make no representations, express or implied, that\nthe content of this repository or the use thereof indicates conformance to a\nspecification. All content is provided as-is to help reach interoperability.\n"
    
    test('decode base64 encoded content', function() {
        assert.equal(findOwners.decode(encoded), decoded);
    });
});

suite('parse OWNERS', function() {
    test('trim content & remove line breaks', function() {
        assert.deepEqual(findOwners.parse("    @ahandle   \n\n  \n @anotherhandle \n  \n \n"), ["ahandle", "anotherhandle"]);
    });
    
    test('remove comments', function() {
        assert.deepEqual(findOwners.parse("  # this is a comment \n @ahandle   \n\n // this is also a comment  \n @anotherhandle \n  \n \n"), ["ahandle", "anotherhandle"]);
    });
    
    test("Remove dups", function() {
        assert.deepEqual(findOwners.parse("    @ahandle   \n\n  \n @anotherhandle \n  @ahandle \n \n"), ["ahandle", "anotherhandle"]);
    });
    
    test("Remove handles which contain whitespace", function() {
        assert.deepEqual(findOwners.parse("@anotherhandle \n  @ahan dle \n \n"), ["anotherhandle"]);
    });
    
    test("Lowecase all the things", function() {
        assert.deepEqual(findOwners.parse("@ahandle   \n\n  \n @AnotherHandle"), ["ahandle", "anotherhandle"]);
    });
});