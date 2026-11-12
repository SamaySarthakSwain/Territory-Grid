package com.yourname.territorygrid.di

import com.yourname.territorygrid.data.repository.AuthRepository
import com.yourname.territorygrid.data.repository.AuthRepositoryImpl
import com.yourname.territorygrid.data.repository.CheckinRepository
import com.yourname.territorygrid.data.repository.CheckinRepositoryImpl
import com.yourname.territorygrid.data.repository.ClueRepository
import com.yourname.territorygrid.data.repository.ClueRepositoryImpl
import com.yourname.territorygrid.data.repository.GameRepository
import com.yourname.territorygrid.data.repository.GameRepositoryImpl
import com.yourname.territorygrid.data.repository.TeamRepository
import com.yourname.territorygrid.data.repository.TeamRepositoryImpl
import dagger.Binds
import dagger.Module
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
abstract class RepositoryModule {

    @Binds
    @Singleton
    abstract fun bindAuthRepository(impl: AuthRepositoryImpl): AuthRepository

    @Binds
    @Singleton
    abstract fun bindGameRepository(impl: GameRepositoryImpl): GameRepository

    @Binds
    @Singleton
    abstract fun bindTeamRepository(impl: TeamRepositoryImpl): TeamRepository

    @Binds
    @Singleton
    abstract fun bindClueRepository(impl: ClueRepositoryImpl): ClueRepository

    @Binds
    @Singleton
    abstract fun bindCheckinRepository(impl: CheckinRepositoryImpl): CheckinRepository
}
