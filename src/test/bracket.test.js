process.env.NODE_ENV = 'TESTNET'

//Require the dev-dependencies
let chai = require('chai')
let chaiHttp = require('chai-http')
let server = require('../server')
let should = chai.should()

chai.use(chaiHttp)
//Our parent block
describe('Pets', () => {
    beforeEach((done) => {
        //Before each test we empty the database in your case
        done()
    })
    /*
     * Test the /GET route
     */
    describe('/GET pets', () => {
        it('it should GET all the pets', (done) => {
            chai.request(server)
                .get('/pets')
                .end((err, res) => {
                    res.should.have.status(200)
                    res.body.should.be.a('array')
                    res.body.length.should.be.eql(9) // fixme :)
                    done()
                })
        })
    })
})

describe('/POST pets', () => {
    it('it should POST a pet', (done) => {
        let pet = {
            name: 'Test 2111',
            start_date: '02/31/2022',
            input_from_bracket: false,
            apply_team_from_bracket: null,
            top_team_from_brackets: 10,
            tournament: 'T-f259bb72-5a7c-4977-b61a-3dd123d3989e',
            game_per_round: 2,
            final_round: 4,
            team_limit: true,
            max_teams: 27,
            enable_3rd_vs_4th: true,
            format: '5 vs 5',
            mode: 'SE',
        }
        chai.request(server)
            .post('/pets')
            .send(pet)
            .end((err, res) => {
                res.should.have.status(200)
                res.body.should.be.a('object')
                res.body.should.have.property('message').eql('Pet successfully added!')
                res.body.pet.should.have.property('id')
                res.body.pet.should.have.property('name').eql(pet.name)
                res.body.pet.should.have.property('status').eql(pet.status)
                done()
            })
    })
    it('it should not POST a book without status field', (done) => {
        let pet = {
            name: 'Bug',
        }
        chai.request(server)
            .post('/pets')
            .send(pet)
            .end((err, res) => {
                res.should.have.status(200)
                res.body.should.be.a('object')
                res.body.should.have.property('message').eql('Pet is invalid!')
                done()
            })
    })
})

describe('/GET/:id pets', () => {
    it('it should GET a pet by the given id', (done) => {
        // TODO add a model to db then get that *id* to take this test
        let id = 1
        chai.request(server)
            .get('/pets/' + id)
            .end((err, res) => {
                res.should.have.status(200)
                res.body.should.be.a('object')
                res.body.should.have.property('pet')
                res.body.pet.should.have.property('id').eql(id)
                res.body.pet.should.have.property('name')
                res.body.pet.should.have.property('status')
                done()
            })
    })
})

describe('/PUT/:id pets', () => {
    it('it should UPDATE a pet given the id', (done) => {
        // TODO add a model to db then get that id to take this test
        let id = 1
        chai.request(server)
            .put('/pets/' + id)
            .send({
                name: 'Bug',
                status: 'fixed',
            })
            .end((err, res) => {
                res.should.have.status(200)
                res.body.should.be.a('object')
                res.body.should.have.property('pet')
                res.body.pet.should.have.property('name').eql('Bug')
                res.body.pet.should.have.property('status').eql('fixed')
                done()
            })
    })
})

describe('/PUT/:id pets', () => {
    it('it should UPDATE a pet given the id', (done) => {
        // TODO add a model to db then get that id to take this test
        let id = 1
        chai.request(server)
            .put('/pets/' + id)
            .send({
                name: 'Bug',
                status: 'fixed',
            })
            .end((err, res) => {
                res.should.have.status(200)
                res.body.should.be.a('object')
                res.body.should.have.property('pet')
                res.body.pet.should.have.property('name').eql('Bug')
                res.body.pet.should.have.property('status').eql('fixed')
                done()
            })
    })
})
