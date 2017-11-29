'use strict';

exports.isStar = true;
exports.runParallel = runParallel;

/** Функция преобразует job в объект
 * @param {Array} job – функция, которая возвращает промис
 * @param {Number} jobIndex - индекс функции в массиве jobs
 * @returns {Object}
 */
function jobToObject(job, jobIndex) {
    return {
        getPromise: job,
        index: jobIndex,
        startTime: 0,
        endTime: 0
    };
}

/** Если promise выполняется дольше timeout то reject
 * @param {Number} timeout - время, дольше которого не должен исполняться promise
 * @returns {Object}
 */
function limitByTime(timeout) {
    return job => () => new Promise((resolve, reject) => {
        job().then(resolve, reject);
        setTimeout(() => reject(new Error('Promise timeout')), timeout);
    });
}

/** Функция паралелльно запускает указанное число промисов
 * @param {Array} jobs – функции, которые возвращают промисы
 * @param {Number} parallelNum - число одновременно исполняющихся промисов
 * @param {Number} timeout - таймаут работы 
 * @returns {Promise}
 */
function runParallel(jobs, parallelNum, timeout = 1000) {
    let jobsObjects = jobs.map(limitByTime(timeout))
        .map((job, jobIndex) => jobToObject(job, jobIndex));
    let finished = 0;

    /** Функция возвращает массив result'ов из всех jobsObject
     * @returns {Array}
     */
    function getResults() {
        let results = [];
        jobsObjects.forEach((jobObject) => results.push(jobObject.result));

        return results;
    }

    /** 
     * @param {Array} resolve 
     * @param {Number} result 
     * @param {Number} jobObject
     */
    function onResult(resolve, result, jobObject) {
        jobObject.result = result;
        ++finished;
        if (jobs.length === finished) {
            resolve(getResults());
        } else if (jobsObjects.length) {
            runPromise(resolve, jobsObjects.shift());
        }
    }

    /**
     * @param {Array} resolve
     * @param {Number} jobObject
     */
    function runPromise(resolve, jobObject) {
        let handler = result => onResult(resolve, result, jobObject);
        jobObject.getPromise().then(handler);
    }

    function runPromises() {
        return new Promise(resolve => {
            if (parallelNum > 0 && jobs.length) {
                let firstJobs = jobsObjects.slice(0, parallelNum);
                jobsObjects = jobsObjects.slice(parallelNum);
                firstJobs.forEach((jobObject) => runPromise(resolve, jobObject));
            } else {
                resolve(getResults());
            }
        });
    }

    return runPromises();
}

