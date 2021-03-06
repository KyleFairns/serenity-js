import * as fs from 'fs';
import * as mockfs from 'mock-fs';

import { FileSystem } from '../../src/io/file_system';
import { isWinOS, osNormalizedPath } from '../path_utils';

import expect = require('../expect');

describe ('FileSystem', () => {

    const
        image      = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABAQMAAAAl21bKAAAAA1BMVEX/TQBcNTh/AAAAAXRSTlPM0jRW/QAAAApJREFUeJxjYgAAAAYAAzY3fKgAAAAASUVORK5CYII=',
        imageBuffer = new Buffer(image, 'base64'),
        originalJSON = { name: 'jan' },
        processCWD   = isWinOS() ? 'C:\\Users\\jan\\projects\\serenityjs' : '/Users/jan/projects/serenityjs';

    beforeEach(() => mockfs({ processCWD: {} }));
    afterEach (() => mockfs.restore());

    describe ('storing JSON files', () => {

        it ('stores a JSON file at a desired location', () => {
            const out = new FileSystem(processCWD);

            return out.store('outlet/some.json', JSON.stringify(originalJSON)).then(absolutePath => {

                expect(fs.existsSync(absolutePath)).to.be.true;
                expect(jsonFrom(absolutePath)).to.eql(originalJSON);
            });
        });

        it ('tells the absolute path to a JSON file once it is saved', () => {
            const out = new FileSystem(processCWD);

            return expect(out.store('outlet/some.json', JSON.stringify(originalJSON))).to.eventually.equal(osNormalizedPath(`${processCWD}/outlet/some.json`));
        });

        it ('complains when provided with an empty path', () => {
            const out = new FileSystem(processCWD);

            return expect(out.store('', JSON.stringify(originalJSON))).to.eventually.be.rejectedWith('Please specify where the file should be saved');
        });

        it ('complains when provided with an inaccessible path', () => {
            mockfs({ '/sys': mockfs.directory({
                mode: 400,
                items: {
                    dir: { /** empty directory */ },
                },
            })});

            const out = new FileSystem('/sys');
            const path = isWinOS() ? '\\\\?\\C:\\sys\\dir' : '/sys/dir';

            return expect(out.store('dir/file.json', JSON.stringify(originalJSON)))
                .to.be.eventually.rejectedWith(`EACCES, permission denied \'${path}\'`);
        });

        it ('complains when provided with an a path to a file that can\'t be overwritten', () => {
            mockfs({ '/sys': mockfs.directory({
                mode: 400,
                items: {
                    'file.json': mockfs.file({
                        mode: 400,
                        content: '',
                    }),
                },
            })});

            const out = new FileSystem('/sys');
            const path = isWinOS() ? '\\\\?\\C:\\sys\\file.json' : '/sys/file.json';

            return expect(out.store('file.json', JSON.stringify(originalJSON)))
                .to.be.eventually.rejectedWith(`EACCES, permission denied \'${path}\'`);
        });
    });

    describe ('storing pictures', () => {

        it ('stores a base64-encoded picture at a desired location', () => {
            const out = new FileSystem(processCWD);

            return out.store('outlet/some.png', imageBuffer).then(absolutePath => {
                expect(fs.existsSync(absolutePath)).to.be.true;
                expect(pictureAt(absolutePath)).to.eql(image);
            });
        });

        it ('tells the absolute path to a JSON file once it is saved', () => {
            const out = new FileSystem(processCWD);

            return expect(out.store('outlet/some.png', imageBuffer)).to.eventually.equal(osNormalizedPath(`${processCWD}/outlet/some.png`));
        });

        it ('complains when provided with an empty path', () => {
            const out = new FileSystem(processCWD);

            return expect(out.store('', imageBuffer)).to.eventually.be.rejectedWith('Please specify where the file should be saved');
        });

    });

    function jsonFrom(file: string) {
        return JSON.parse(fs.readFileSync(file).toString('ascii'));
    }

    function pictureAt(path: string) {
        return new Buffer(fs.readFileSync(path)).toString('base64');
    }
});
