/**
 * Archives or deleles emails based on the retention period described by the parameters.
 * 
 * @param {string} query The filter query used to target email threads.
 * @param {number} archivePeriod The number of days before an email thread is archived. Set to null or a negative number to disable.
 * @param {number} deletePeriod The number of days before an email thread is deleted. Set to null or a negative number to disable.
 */
function manageMatchingEmails(query, archivePeriod, deletePeriod){
  if(archivePeriod != null && archivePeriod >= 0){
    manageThreads("archive", query + restrictQueryTimeRange(archivePeriod + "d"));
  }
  if(deletePeriod != null && deletePeriod >= 0){
     manageThreads("delete", query + restrictQueryTimeRange(deletePeriod + "d"));
  }
}

/**
 * Assembles a Gmail query based on JSON criteria. 
 * 
 * @param {object} criteria The criteria from which to build the query. Expects 'from' (a list of from addresses) and 'subject' (a list of subjects)
 * @returns a Gmail query. Multiple criteria of the same type will be joined by OR logic. Criteria of different types will be joined with AND logic.
 */
function queryBuilder(criteria){
  var fromClause = "";
  if(criteria.from && Array.isArray(criteria.from) && criteria.from.length > 1){
    fromClause = "{";
    for (let email of criteria.from){
      fromClause += " from:(" + email + ")";
    }
    fromClause += "}";
  }else{
    fromClause += criteria.from ? criteria.from : "";
  }
  var subjectClause = "";
  if(criteria.subject && Array.isArray(criteria.subject) && criteria.subject.length > 1){
    subjectClause = "{";
    for (let subject of criteria.subject){
      subjectClause += ' subject:("'+ subject + '")';
    }
    subjectClause += "}"
  }else{
    subjectClause += criteria.subject ? " subject:(" + criteria.subject + ")":"";
  }

return fromClause + " " + subjectClause
}

/**
 * Returns a string to append to a Gmail query to set a timeframe for the results.
 * 
 * @param {string} olderThan The relative latest period from which results should be returned. Must be in the format of [0-9]*(d|m|y).
 * @param {string} newerThan The relative oldest period from which results should be returned. Must be in the format of [0-9]*(d|m|y).
 * @returns {string} A string representing the criteria to bound a Gmail query to a certain relative timeframe.
 */
function restrictQueryTimeRange(olderThan, newerThan){
  const regex = /\d+[dmy]/i;
  let expression = " "; // space here so it fits in nicely with existing queries.
  if(olderThan){
    if(!regex.test(olderThan)){
      throw new Error(`The value for parameter 'olderThan' must be in the format of a number followed by d, m, or y.`);
    }

    expression += `older_than:${olderThan.toLowerCase()}`;
    expression += newerThan ? " " : "";
  }
  if(newerThan){
    if(!regex.test(newerThan)){
      throw new Error(`The value for parameter 'newerThan' must be in the format of a number followed by d, m, or y.`);
    }
    expression += `newer_than:${newerThan.toLowerCase()}`;
  }
  return expression;
}

/**
 * Manages a Gmail threads based on a given query.
 * 
 * @param {string} action The action to take on matching queries. Supported actions: delete | archive.
 * @param {string} query The query used to select email threads. Use {@link queryBuilder} for suggested query format.
 * @throws Will throw an error if a non-supported action is passed to the function. 
 */
function manageThreads(action, query) {
  let threads = GmailApp.search(query);
  if(threads.length === 0){
  return;
  }
  switch(action.toLowerCase()){
    case "delete":
      Logger.log(`Removing ${threads.length} threads.`);
      // there's a max of 100 threads/operation. Chunk it into manageable arrays.
      while(threads.length) {
        GmailApp.moveThreadsToTrash(threads.splice(0,99)); 
      }
      break;
    case "archive":
      let inboxThreads = threads.filter(thread => thread.isInInbox()); // Only try archiving items that aren't archived.
      if(inboxThreads.length === 0){
        return;
      }
      Logger.log(`Archiving ${inboxThreads.length} threads.`);
      while(inboxThreads.length) {
        GmailApp.moveThreadsToArchive(inboxThreads.splice(0,99));
      }
      break;
    default:
      throw new Error("Email management action not supported.");
  }
}
