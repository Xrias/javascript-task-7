'use strict';

exports.isStar = true;
exports.runParallel = runParallel;

function jobToObject(job, jobIndex) {
    return {
        getPromise: job,
        index: jobIndex,
        startTime: 0,
        endTime: 0,
        result: []
    };

}

/** Функция паралелльно запускает указанное число промисов
 * @param {Array} jobs – функции, которые возвращают промисы
 * @param {Number} parallelNum - число одновременно исполняющихся промисов
 * @param {Number} timeout - таймаут работы 
 * @returns {Promise}
 */
function runParallel(jobs, parallelNum, timeout = 1000) {
    let jobsObjects = jobs.map((job, jobIndex) => jobToObject(job, jobIndex));
    let finished = 0;

    function getResults() {
        let results = [];
        jobsObjects.forEach((jobObject) => results.push(jobObject.result));

        return results;
    }

    function onResult(resolve, result, jobObject) {
        jobObject.result = result;
        ++finished;
        if (jobs.length === finished) {
            let results = getResults();
            resolve(results);
        } else if (jobsObjects.length > 0) {
            runPromise(resolve, jobsObjects.shift());
        }
    }

    function runPromise(resolve, jobObject) {
        jobObject.startTime = Date.now();
        let handler = result => onResult(resolve, result, jobObject);
        jobObject.endTime = Date.now();

        jobObject.getPromise().then(handler, handler);

    }

    function runPromises() {
        return new Promise(resolve => {
            if (parallelNum > 0 && jobs.length > 0) {
                let firstJobs = jobsObjects.slice(0, parallelNum);
                jobsObjects = jobsObjects.slice(parallelNum);
                firstJobs.forEach((jobObject) => runPromise(resolve, jobObject));
            } else {
                resolve([]);
            }
        });
    }

    return runPromises();
}
