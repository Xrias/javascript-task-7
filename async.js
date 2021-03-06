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
        index: jobIndex
    };
}

/** Если promise выполняется дольше timeout то reject
 * @param {Number} timeout - время, дольше которого не должен исполняться promise
 * @returns {Object}
 */
function limitByTime(timeout) {
    return job => () => new Promise((resolve_, reject_) => {
        job().then(resolve_, reject_);
        setTimeout(() => reject_(new Error('Promise timeout')), timeout);
    });
}

/** Функция паралелльно запускает указанное число промисов
 * @param {Array} jobs – функции, которые возвращают промисы
 * @param {Number} parallelNum - число одновременно исполняющихся промисов
 * @param {Number} timeout - таймаут работы 
 * @returns {Promise}
 */
function runParallel(jobs, parallelNum, timeout = 1000) {
    return new Promise(resolve => {
        if (parallelNum <= 0 || !jobs.length) {
            resolve([]);
        }
        let jobsObjects = jobs.map(limitByTime(timeout))
            .map((job, jobIndex) => jobToObject(job, jobIndex));
        let finished = 0;
        let startCount = 0;
        let results = [];

        /** Запускаем promise
         * @param {Number} jobObject
         */
        function runPromise(jobObject) {
            startCount++;
            let handler = result => onResult(result, jobObject);
            jobObject.getPromise().then(handler)
                .catch(handler);
        }

        /** Если закончили то resolve, если нет то запускаем следующий
         * @param {Number} result 
         * @param {Object} jobObject
         */
        function onResult(result, jobObject) {
            results[jobObject.index] = result;
            ++finished;
            if (jobsObjects.length === finished) {
                resolve(results);
            }
            if (startCount < jobsObjects.length) {
                runPromise(jobsObjects[startCount]);
            }
        }

        jobsObjects.slice(0, parallelNum).forEach(jobObject => runPromise(jobObject));
    });
}
