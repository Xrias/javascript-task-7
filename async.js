'use strict';

exports.isStar = true;
exports.runParallel = runParallel;

/** Функция паралелльно запускает указанное число промисов
 * @param {Array} jobs – функции, которые возвращают промисы
 * @param {Number} parallelNum - число одновременно исполняющихся промисов
 * @param {Number} timeout - таймаут работы 
 * @returns {Promise}
 */
function runParallel(jobs, parallelNum) {
    let result = [];

    function getPromise() {
        return new Promise(resolve => {
            if (parallelNum > 0 && jobs.length > 0) {
                jobs.forEach((job) => {
                    let state = job => resolve(result);
                    job().then(state, state);
                });
            } else {
                resolve(result);
            }
        });
    }

    return getPromise();
}
