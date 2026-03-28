// client/src/data/portalUrls.js
export const PORTAL_URLS = {
  'Massachusetts Institute of Technology': { url: 'https://apply.mit.edu', type: 'direct' },
  'MIT': { url: 'https://apply.mit.edu', type: 'direct' },
  'Stanford University': { url: 'https://gradadmissions.stanford.edu/apply', type: 'direct' },
  'Harvard University': { url: 'https://gsas.harvard.edu/apply', type: 'direct' },
  'Carnegie Mellon University': { url: 'https://www.cmu.edu/graduate-admissions/apply/', type: 'direct' },
  'CMU': { url: 'https://www.cmu.edu/graduate-admissions/apply/', type: 'direct' },
  'Cornell University': { url: 'https://www.gradschool.cornell.edu/admissions/apply/', type: 'direct' },
  'Columbia University': { url: 'https://apply.gsas.columbia.edu', type: 'direct' },
  'New York University': { url: 'https://www.nyu.edu/admissions/graduate-admissions/how-to-apply.html', type: 'direct' },
  'NYU': { url: 'https://www.nyu.edu/admissions/graduate-admissions/how-to-apply.html', type: 'direct' },
  'University of Pennsylvania': { url: 'https://www.upenn.edu/admissions/graduate-professional', type: 'direct' },
  'Yale University': { url: 'https://gsas.yale.edu/admissions/applying-yale', type: 'direct' },
  'Princeton University': { url: 'https://gradschool.princeton.edu/admission/applying-princeton/application', type: 'direct' },
  'Georgia Institute of Technology': { url: 'https://grad.gatech.edu/apply', type: 'direct' },
  'Georgia Tech': { url: 'https://grad.gatech.edu/apply', type: 'direct' },
  'University of California San Diego': { url: 'https://gradapply.ucsd.edu/apply/', type: 'direct' },
  'UCSD': { url: 'https://gradapply.ucsd.edu/apply/', type: 'direct' },
  'University of California Berkeley': { url: 'https://grad.berkeley.edu/admissions/apply/', type: 'direct' },
  'UC Berkeley': { url: 'https://grad.berkeley.edu/admissions/apply/', type: 'direct' },
  'University of Michigan': { url: 'https://rackham.umich.edu/admissions/applying/', type: 'direct' },
  'University of Washington': { url: 'https://grad.uw.edu/admissions/applying-to-graduate-school/', type: 'direct' },
  'University of Massachusetts Amherst': { url: 'https://www.umass.edu/gradschool/admissions/how-apply', type: 'direct' },
  'UMass Amherst': { url: 'https://www.umass.edu/gradschool/admissions/how-apply', type: 'direct' },
  'Arizona State University': { url: 'https://graduate.asu.edu/apply', type: 'direct' },
  'ASU': { url: 'https://graduate.asu.edu/apply', type: 'direct' },
  'University of Texas at Austin': { url: 'https://utdirect.utexas.edu/apps/adm/admisgrad/', type: 'direct' },
  'UT Austin': { url: 'https://utdirect.utexas.edu/apps/adm/admisgrad/', type: 'direct' },
  'Purdue University': { url: 'https://gradapply.purdue.edu/apply/', type: 'direct' },
  'Northeastern University': { url: 'https://graduateadmissions.northeastern.edu/apply/', type: 'direct' },
  'Boston University': { url: 'https://www.bu.edu/admissions/graduate/', type: 'direct' },
  'BU': { url: 'https://www.bu.edu/admissions/graduate/', type: 'direct' },
  'University of Toronto': { url: 'https://apply.sgs.utoronto.ca/', type: 'direct' },
  'University of Waterloo': { url: 'https://uwaterloo.ca/graduate-studies-postdoctoral-affairs/future-students/how-apply', type: 'direct' },
  'University of Ottawa': { url: 'https://grad.uottawa.ca/en/programs/applying', type: 'direct' },
  'McGill University': { url: 'https://www.mcgill.ca/applying/graduate', type: 'direct' },
};

export const COMMON_APP_URL = 'https://www.commonapp.org/apply';

export function getPortalInfo(universityName, degreeLevel) {
  if (degreeLevel === 'undergraduate') {
    return { url: COMMON_APP_URL, type: 'common_app' };
  }
  return PORTAL_URLS[universityName] || null;
}
